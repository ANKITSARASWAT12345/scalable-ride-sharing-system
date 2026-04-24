import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/services/auth';
import { BookingDraft } from '../../core/services/booking-draft';
import { LocationSearch } from '../../core/services/location-search';
import {
  LocationSelection,
  LocationSuggestion,
} from '../../core/models/location.model';
import { VehicleType } from '../../core/models/ride.model';

type AddressTarget = 'pickup' | 'drop';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  user = inject(Auth).getCurrentUser();
  bookingForm: FormGroup;

  featuredLocations: LocationSuggestion[] = [];
  pickupSuggestions: LocationSuggestion[] = [];
  dropSuggestions: LocationSuggestion[] = [];

  errorMessage = '';
  currentLocationMessage = 'Checking your current location for faster pickup...';
  currentLocationState: 'idle' | 'loading' | 'ready' | 'error' = 'loading';
  activeSuggestionTarget: AddressTarget | null = null;

  private readonly suggestionRequestId: Record<AddressTarget, number> = {
    pickup: 0,
    drop: 0,
  };

  vehicles: { type: VehicleType; label: string; desc: string; eta: string }[] = [
    { type: 'BIKE', label: 'Moto', desc: 'Fast lane pickup for one rider', eta: '2 min away' },
    { type: 'AUTO', label: 'Auto', desc: 'Everyday city travel with low fares', eta: '4 min away' },
    { type: 'CAR', label: 'Premier', desc: 'Extra comfort for airport and office rides', eta: '6 min away' },
  ];

  constructor(
    private fb: FormBuilder,
    private bookingDraft: BookingDraft,
    private locationSearch: LocationSearch,
    private router: Router
  ) {
    this.bookingForm = this.fb.group({
      pickupAddress: ['', Validators.required],
      pickupLat: [null, Validators.required],
      pickupLng: [null, Validators.required],
      dropAddress: ['', Validators.required],
      dropLat: [null, Validators.required],
      dropLng: [null, Validators.required],
      vehicleType: ['BIKE', Validators.required],
    });
  }

  ngOnInit(): void {
    this.restoreDraft();
    this.loadFeaturedLocations();
    this.prefillCurrentLocationFromStorage();
    void this.captureCurrentLocation(true);
  }

  get primaryActionLabel(): string {
    if (this.user?.role === 'DRIVER') {
      return 'Open driver dashboard';
    }

    if (this.user?.role === 'RIDER') {
      return 'Continue to booking';
    }

    return 'Sign up to ride';
  }

  profileInitial(): string {
    return this.user?.name?.trim()?.charAt(0)?.toUpperCase() || 'R';
  }

  selectVehicle(type: VehicleType): void {
    this.bookingForm.patchValue({ vehicleType: type });
    this.bookingDraft.setVehicleType(type);
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
      void this.resolveManualAddress(target);
      this.clearSuggestions(target);
    }, 180);
  }

  onAddressInput(target: AddressTarget): void {
    this.errorMessage = '';
    this.bookingForm.patchValue(
      {
        [`${target}Lat`]: null,
        [`${target}Lng`]: null,
      },
      { emitEvent: false }
    );

    if (target === 'pickup') {
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
    await this.captureCurrentLocation(false);
  }

  async continueToBooking(): Promise<void> {
    const pickupResolved = await this.resolveManualAddress('pickup');
    const dropResolved = await this.resolveManualAddress('drop');

    if (!pickupResolved || !dropResolved || this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      this.errorMessage = 'Select a valid pickup and destination before continuing.';
      return;
    }

    this.bookingDraft.setVehicleType(this.bookingForm.get('vehicleType')?.value as VehicleType);

    if (this.user?.role === 'DRIVER') {
      await this.router.navigate(['/driver/dashboard']);
      return;
    }

    if (this.user?.role === 'RIDER') {
      await this.router.navigate(['/rider/dashboard']);
      return;
    }

    await this.router.navigate(['/auth/register']);
  }

  private restoreDraft(): void {
    const draft = this.bookingDraft.getDraft();
    this.bookingForm.patchValue({
      vehicleType: draft.vehicleType,
    });

    if (draft.pickup) {
      this.applyResolvedLocation('pickup', draft.pickup);
    }

    if (draft.drop) {
      this.applyResolvedLocation('drop', draft.drop);
    }
  }

  private prefillCurrentLocationFromStorage(): void {
    const currentLocation = this.bookingDraft.getCurrentLocation();

    if (!currentLocation) {
      return;
    }

    this.currentLocationState = 'ready';
    this.currentLocationMessage = `Pickup ready near ${currentLocation.address}`;

    if (!this.bookingDraft.getDraft().pickup) {
      this.applyResolvedLocation('pickup', currentLocation);
    }
  }

  private loadFeaturedLocations(): void {
    this.locationSearch.getFeaturedLocations().subscribe((locations) => {
      this.featuredLocations = locations;
    });
  }

  private showFeaturedSuggestions(target: AddressTarget): void {
    const suggestions = this.featuredLocations.slice(0, 6);

    if (target === 'pickup') {
      this.pickupSuggestions = suggestions;
    } else {
      this.dropSuggestions = suggestions;
    }
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

  private async resolveManualAddress(target: AddressTarget): Promise<boolean> {
    if (this.hasResolvedCoordinates(target)) {
      return true;
    }

    const address = this.bookingForm.get(`${target}Address`)?.value?.trim();
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
        [`${target}Lng`]: selection.longitude,
      },
      { emitEvent: false }
    );

    if (target === 'pickup') {
      this.bookingDraft.setPickup(selection);
    } else {
      this.bookingDraft.setDrop(selection);
    }
  }

  private hasResolvedCoordinates(target: AddressTarget): boolean {
    return Number.isFinite(this.bookingForm.get(`${target}Lat`)?.value)
      && Number.isFinite(this.bookingForm.get(`${target}Lng`)?.value);
  }

  private async captureCurrentLocation(silent: boolean): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.currentLocationState = 'error';
      this.currentLocationMessage = 'Current location is not available in this browser.';
      return;
    }

    if (!silent) {
      this.currentLocationState = 'loading';
      this.currentLocationMessage = 'Reading your current pickup point...';
    }

    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const selection = await this.locationSearch.reverseGeocode(
            position.coords.latitude,
            position.coords.longitude
          );

          this.bookingDraft.setCurrentLocation(selection);

          if (!this.bookingDraft.getDraft().pickup) {
            this.applyResolvedLocation('pickup', selection);
          }

          this.currentLocationState = 'ready';
          this.currentLocationMessage = `Current pickup locked near ${selection.address}`;
          resolve();
        },
        () => {
          this.currentLocationState = 'error';
          this.currentLocationMessage = 'Location access is off. You can still type pickup manually.';
          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 60000,
        }
      );
    });
  }
}
