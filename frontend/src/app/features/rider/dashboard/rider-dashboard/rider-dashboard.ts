import {
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { Auth } from '../../../../core/services/auth';
import {
  NearbyDriver,
  RideResponse,
  RideStatus,
  VehicleType
} from '../../../../core/models/ride.model';
import { RouterLink } from '@angular/router';
import { Ride } from '../../../../core/services/ride';
import { Websocket } from '../../../../core/services/websocket';
import { Payment } from '../../../../core/services/payment';
import { PostRideModal } from '../../../../shared/components/post-ride-modal/post-ride-modal';
import { RideMap } from '../../../../shared/components/ride-map/ride-map';
import { BookingDraft } from '../../../../core/services/booking-draft';
import { LocationSearch } from '../../../../core/services/location-search';
import { LocationSelection, LocationSuggestion } from '../../../../core/models/location.model';
import { InAppNotifications } from '../../../../core/services/in-app-notifications';

type AddressTarget = 'pickup' | 'drop';

interface DriverPosition {
  latitude: number;
  longitude: number;
  timestamp: number;
}

@Component({
  selector: 'app-rider-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    RideMap,
    PostRideModal
  ],
  templateUrl: './rider-dashboard.html',
  styleUrl: './rider-dashboard.scss',
})
export class RiderDashboard implements OnInit, OnDestroy {
  user = inject(Auth).getCurrentUser();
  bookingForm: FormGroup;

  activeRide: RideResponse | null = null;
  rideHistory: RideResponse[] = [];
  driverPosition: DriverPosition | null = null;
  previewNearbyDrivers: NearbyDriver[] = [];

  isBooking = false;
  isLoadingHistory = false;
  isResolvingLocation = false;
  errorMessage = '';
  view: 'book' | 'history' = 'book';
  currentLocationLabel = '';
  profileMenuOpen = false;

  pickupSuggestions: LocationSuggestion[] = [];
  dropSuggestions: LocationSuggestion[] = [];
  activeSuggestionTarget: AddressTarget | null = null;

  showPostRideModal = false;
  completedRide: RideResponse | null = null;
  walletBalance = 0;

  private locationSub: Subscription | null = null;
  private statusSub: Subscription | null = null;
  private wsStatusSub: Subscription | null = null;
  private notificationSub: Subscription | null = null;
  private trackedRideId: string | null = null;
  private lastRideStatusNotified: RideStatus | null = null;
  private readonly suggestionRequestId: Record<AddressTarget, number> = {
    pickup: 0,
    drop: 0
  };

  vehicles: { type: VehicleType; label: string; icon: string; desc: string }[] = [
    { type: 'BIKE', label: 'Bike', icon: 'Bike', desc: 'Fastest in traffic' },
    { type: 'AUTO', label: 'Auto', icon: 'Auto', desc: 'Affordable everyday ride' },
    { type: 'CAR', label: 'Car', icon: 'Car', desc: 'Comfort with AC' }
  ];

  get canShowPreviewMap(): boolean {
    return !this.activeRide && this.hasResolvedCoordinates('pickup') && this.hasResolvedCoordinates('drop');
  }

  get completedRidesCount(): number {
    return this.rideHistory.filter(ride => ride.status === 'COMPLETED').length;
  }

  get cancelledRidesCount(): number {
    return this.rideHistory.filter(ride => ride.status === 'CANCELLED').length;
  }

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private rideService: Ride,
    private wsService: Websocket,
    private paymentService: Payment,
    private bookingDraft: BookingDraft,
    private locationSearch: LocationSearch,
    private notifications: InAppNotifications
  ) {
    this.bookingForm = this.fb.group({
      pickupAddress: ['', Validators.required],
      pickupLat: [null, Validators.required],
      pickupLng: [null, Validators.required],
      dropAddress: ['', Validators.required],
      dropLat: [null, Validators.required],
      dropLng: [null, Validators.required],
      vehicleType: ['BIKE', Validators.required]
    });
  }

  ngOnInit(): void {
    this.restoreBookingDraft();
    this.wsService.connect();

    this.wsStatusSub = this.wsService.status$
      .pipe(
        filter(status => status === 'CONNECTED'),
        take(1)
      )
      .subscribe(() => {
        this.notificationSub = this.wsService
          .subscribe<any>('/user/queue/notifications')
          .subscribe(notification => this.handlePrivateNotification(notification));

        this.loadHistory();
      });

    this.loadWalletBalance();
  }

  ngOnDestroy(): void {
    this.stopTrackingRide();
    this.wsStatusSub?.unsubscribe();
    this.notificationSub?.unsubscribe();
  }

  async bookRide(): Promise<void> {
    const coordinatesResolved = await this.ensureResolvedCoordinates();

    if (!coordinatesResolved || this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      this.errorMessage = 'Select valid pickup and drop locations from suggestions before booking.';
      return;
    }

    this.isBooking = true;
    this.errorMessage = '';

    this.rideService.bookRide(this.bookingForm.getRawValue()).subscribe({
      next: (ride) => {
        this.activeRide = ride;
        this.previewNearbyDrivers = [];
        this.isBooking = false;
        this.view = 'book';
        this.lastRideStatusNotified = ride.status;
        this.startTrackingRide(ride.id);
        this.loadHistory();
        this.notifications.show(
          'Ride booked',
          ride.driverName
            ? `${ride.driverName} has been assigned to your ride.`
            : 'We are finding the best nearby driver for you.',
          'success'
        );
      },
      error: (err) => {
        this.isBooking = false;
        this.errorMessage = err.error?.error || 'Booking failed. Try again.';
        this.notifications.show('Booking failed', this.errorMessage, 'error');
      }
    });
  }

  onAddressFocus(target: AddressTarget): void {
    this.activeSuggestionTarget = target;
    const query = this.bookingForm.get(`${target}Address`)?.value?.trim() || '';

    if (!query) {
      this.showFeaturedSuggestions(target);
      return;
    }

    this.fetchSuggestions(target, query);
  }

  onAddressBlur(target: AddressTarget): void {
    window.setTimeout(() => {
      void this.resolveAddressIfNeeded(target);
      this.clearSuggestions(target);
    }, 180);
  }

  onAddressInput(target: AddressTarget): void {
    this.bookingForm.patchValue(
      {
        [`${target}Lat`]: null,
        [`${target}Lng`]: null,
      },
      { emitEvent: false }
    );

    if (target === 'pickup') {
      this.previewNearbyDrivers = [];
      this.bookingDraft.setPickup(null);
    } else {
      this.bookingDraft.setDrop(null);
    }

    const query = this.bookingForm.get(`${target}Address`)?.value?.trim() || '';

    if (!query) {
      this.showFeaturedSuggestions(target);
      return;
    }

    this.fetchSuggestions(target, query);
  }

  async selectSuggestion(target: AddressTarget, suggestion: LocationSuggestion): Promise<void> {
    const selection = await this.locationSearch.resolveSuggestion(suggestion);

    if (!selection) {
      this.errorMessage = 'Could not resolve that place. Try another address.';
      return;
    }

    this.applyResolvedLocation(target, selection);
    this.clearSuggestions(target);
  }

  async useCurrentLocation(): Promise<void> {
    if (!navigator.geolocation) {
      this.errorMessage = 'Geolocation is not available in this browser.';
      return;
    }

    this.isResolvingLocation = true;
    this.errorMessage = '';

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const selection = await this.locationSearch.reverseGeocode(
          position.coords.latitude,
          position.coords.longitude
        );

        this.bookingDraft.setCurrentLocation(selection);
        this.currentLocationLabel = selection.address;
        this.applyResolvedLocation('pickup', selection);
        this.isResolvingLocation = false;
      },
      () => {
        this.isResolvingLocation = false;
        this.errorMessage = 'Could not read your current location.';
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 1000
      }
    );
  }

  refreshRide(): void {
    if (!this.activeRide) return;

    this.rideService.getRide(this.activeRide.id).subscribe({
      next: (ride) => {
        this.activeRide = ride;
        this.maybeNotifyRideStatus(ride.status);
      },
      error: () => {
        this.errorMessage = 'Failed to refresh ride.';
      }
    });
  }

  selectVehicle(type: VehicleType): void {
    this.bookingForm.patchValue({ vehicleType: type });
    this.bookingDraft.setVehicleType(type);
    this.loadNearbyDriversPreview();
  }

  cancelRide(): void {
    if (!this.activeRide) return;

    this.rideService.cancelRide(this.activeRide.id, 'Cancelled by rider').subscribe({
      next: () => {
        this.stopTrackingRide();
        this.activeRide = null;
        this.driverPosition = null;
        this.loadHistory();
        this.notifications.show('Ride cancelled', 'Your trip has been cancelled.', 'warning');
      }
    });
  }

  loadHistory(): void {
    this.isLoadingHistory = true;

    const activeStatuses: RideStatus[] = ['REQUESTED', 'ACCEPTED', 'PICKED_UP', 'IN_PROGRESS'];

    this.rideService.getMyRides().subscribe({
      next: (rides) => {
        const active = rides.find(r => activeStatuses.includes(r.status));

        if (active) {
          this.activeRide = active;
          this.previewNearbyDrivers = [];
          this.maybeNotifyRideStatus(active.status);
          if (this.trackedRideId !== active.id) {
            this.startTrackingRide(active.id);
          }
        } else if (this.activeRide || this.trackedRideId) {
          this.activeRide = null;
          this.stopTrackingRide();
        }

        this.rideHistory = rides.filter(r => !activeStatuses.includes(r.status));
        this.isLoadingHistory = false;
      },
      error: () => {
        this.isLoadingHistory = false;
      }
    });
  }

  loadWalletBalance(): void {
    this.paymentService.getWallet().subscribe({
      next: (wallet) => this.walletBalance = wallet.balance
    });
  }

  async topUpWallet(): Promise<void> {
    try {
      const wallet = await this.paymentService.topUpWallet(200);
      this.walletBalance = wallet.balance;
      this.notifications.show('Wallet updated', 'INR 200 was added to your wallet.', 'success');
    } catch (err: any) {
      this.errorMessage = err.error?.error || 'Top-up failed. Please try again.';
      this.notifications.show('Top-up failed', this.errorMessage, 'error');
    }
  }

  onRatingModalClosed(): void {
    this.showPostRideModal = false;
    this.completedRide = null;
  }

  openProfileMenu(): void {
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  showRides(): void {
    this.view = 'history';
    this.profileMenuOpen = false;
  }

  logout(): void {
    this.wsService.disconnect();
    this.authService.logout();
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      REQUESTED: 'Finding your driver',
      ACCEPTED: 'Driver is on the way',
      PICKED_UP: 'Driver has arrived',
      IN_PROGRESS: 'Ride in progress',
      COMPLETED: 'Ride completed',
      CANCELLED: 'Ride cancelled'
    };
    return labels[status] ?? status;
  }

  private startTrackingRide(rideId: string): void {
    if (this.trackedRideId === rideId && this.locationSub && this.statusSub) {
      return;
    }

    this.stopTrackingRide();
    this.trackedRideId = rideId;

    this.locationSub = this.wsService
      .subscribe<DriverPosition>(`/topic/ride/${rideId}/driver-location`)
      .subscribe(position => {
        this.driverPosition = position;
      });

    this.statusSub = this.wsService
      .subscribe<any>(`/topic/ride/${rideId}/status`)
      .subscribe(update => {
        this.syncRideFromStatusUpdate(rideId, update?.status);
      });
  }

  private stopTrackingRide(): void {
    this.locationSub?.unsubscribe();
    this.statusSub?.unsubscribe();
    this.locationSub = null;
    this.statusSub = null;
    this.trackedRideId = null;
    this.driverPosition = null;
  }

  private async ensureResolvedCoordinates(): Promise<boolean> {
    const pickupResolved = await this.resolveAddressIfNeeded('pickup');
    const dropResolved = await this.resolveAddressIfNeeded('drop');
    return pickupResolved && dropResolved;
  }

  private async resolveAddressIfNeeded(target: AddressTarget): Promise<boolean> {
    if (this.hasResolvedCoordinates(target)) {
      return true;
    }

    const address = this.bookingForm.get(`${target}Address`)?.value?.trim();
    if (!address) {
      return false;
    }

    return this.resolveAddress(target, address);
  }

  private async resolveAddress(target: AddressTarget, address: string): Promise<boolean> {
    if (!address) {
      return false;
    }

    const selection = await this.locationSearch.geocodeAddress(address);

    if (!selection) {
      return false;
    }

    this.applyResolvedLocation(target, selection);
    return true;
  }

  private applyResolvedLocation(target: AddressTarget, selection: LocationSelection): void {
    this.bookingForm.patchValue(
      {
        [`${target}Address`]: selection.address,
        [`${target}Lat`]: selection.latitude,
        [`${target}Lng`]: selection.longitude
      },
      { emitEvent: false }
    );

    if (target === 'pickup') {
      this.bookingDraft.setPickup(selection);
      this.loadNearbyDriversPreview();
      this.currentLocationLabel = this.currentLocationLabel || selection.address;
      return;
    }

    this.bookingDraft.setDrop(selection);
  }

  private loadNearbyDriversPreview(): void {
    if (!this.hasResolvedCoordinates('pickup')) {
      this.previewNearbyDrivers = [];
      return;
    }

    const pickupLat = this.bookingForm.get('pickupLat')?.value;
    const pickupLng = this.bookingForm.get('pickupLng')?.value;
    const vehicleType = this.bookingForm.get('vehicleType')?.value as VehicleType;

    this.rideService.getNearbyDrivers(pickupLat, pickupLng, vehicleType).subscribe({
      next: (drivers) => {
        this.previewNearbyDrivers = drivers.slice(0, 5);
      },
      error: () => {
        this.previewNearbyDrivers = [];
      }
    });
  }

  private hasResolvedCoordinates(target: AddressTarget): boolean {
    return Number.isFinite(this.bookingForm.get(`${target}Lat`)?.value)
      && Number.isFinite(this.bookingForm.get(`${target}Lng`)?.value);
  }

  private syncRideFromStatusUpdate(rideId: string, fallbackStatus?: string): void {
    this.rideService.getRide(rideId).subscribe({
      next: (ride) => {
        this.activeRide = ride;
        this.maybeNotifyRideStatus(ride.status);
        this.handleRideLifecycleTransition(ride);
      },
      error: () => {
        if (!this.activeRide) {
          return;
        }

        const status = this.isRideStatus(fallbackStatus) ? fallbackStatus : this.activeRide.status;
        const activeRide = { ...this.activeRide, status };
        this.activeRide = activeRide;
        this.maybeNotifyRideStatus(activeRide.status);
        this.handleRideLifecycleTransition(activeRide);
      }
    });
  }

  private handleRideLifecycleTransition(ride: RideResponse): void {
    if (ride.status === 'COMPLETED') {
      this.completedRide = ride;
      this.showPostRideModal = true;
      this.activeRide = null;
      this.stopTrackingRide();
      this.loadHistory();
      this.loadWalletBalance();
      return;
    }

    if (ride.status === 'CANCELLED') {
      this.activeRide = null;
      this.stopTrackingRide();
      this.loadHistory();
    }
  }

  private maybeNotifyRideStatus(status: RideStatus): void {
    if (this.lastRideStatusNotified === status) {
      return;
    }

    this.lastRideStatusNotified = status;
    const config: Record<RideStatus, { title: string; message: string; tone: 'success' | 'info' | 'warning' }> = {
      REQUESTED: {
        title: 'Driver search started',
        message: 'We are matching you with a nearby driver.',
        tone: 'info'
      },
      ACCEPTED: {
        title: 'Driver assigned',
        message: 'Your driver accepted the ride and is heading to pickup.',
        tone: 'success'
      },
      PICKED_UP: {
        title: 'Driver arrived',
        message: 'Your driver is at the pickup point.',
        tone: 'info'
      },
      IN_PROGRESS: {
        title: 'Ride started',
        message: 'Your trip is now in progress.',
        tone: 'info'
      },
      COMPLETED: {
        title: 'Ride completed',
        message: 'Thanks for riding. You can rate the trip now.',
        tone: 'success'
      },
      CANCELLED: {
        title: 'Ride cancelled',
        message: 'This trip is no longer active.',
        tone: 'warning'
      }
    };

    const entry = config[status];
    this.notifications.show(entry.title, entry.message, entry.tone);
  }

  private handlePrivateNotification(notification: any): void {
    const type = notification?.type;
    if (type === 'RIDE_ASSIGNED') {
      this.notifications.show('Driver matched', 'A driver has been assigned to your route.', 'success');
      this.loadHistory();
      return;
    }

    if (type) {
      this.notifications.show('Update', `New event received: ${type}.`, 'info');
    }
  }

  private isRideStatus(status?: string): status is RideStatus {
    return [
      'REQUESTED',
      'ACCEPTED',
      'PICKED_UP',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED'
    ].includes(status ?? '');
  }

  private restoreBookingDraft(): void {
    const draft = this.bookingDraft.getDraft();
    const currentLocation = this.bookingDraft.getCurrentLocation();

    this.bookingForm.patchValue({
      vehicleType: draft.vehicleType
    });

    if (draft.pickup) {
      this.applyResolvedLocation('pickup', draft.pickup);
    } else if (currentLocation) {
      this.applyResolvedLocation('pickup', currentLocation);
      this.currentLocationLabel = currentLocation.address;
    }

    if (draft.drop) {
      this.applyResolvedLocation('drop', draft.drop);
    }
  }

  private showFeaturedSuggestions(target: AddressTarget): void {
    this.locationSearch.getFeaturedLocations().subscribe((locations) => {
      if (target === 'pickup') {
        this.pickupSuggestions = locations.slice(0, 6);
      } else {
        this.dropSuggestions = locations.slice(0, 6);
      }
    });
  }

  private fetchSuggestions(target: AddressTarget, query: string): void {
    const requestId = ++this.suggestionRequestId[target];

    this.locationSearch.searchLocations(query).subscribe((suggestions) => {
      if (requestId !== this.suggestionRequestId[target]) {
        return;
      }

      if (target === 'pickup') {
        this.pickupSuggestions = suggestions;
      } else {
        this.dropSuggestions = suggestions;
      }
    });
  }

  private clearSuggestions(target: AddressTarget): void {
    if (target === 'pickup') {
      this.pickupSuggestions = [];
    } else {
      this.dropSuggestions = [];
    }

    if (this.activeSuggestionTarget === target) {
      this.activeSuggestionTarget = null;
    }
  }
}
