import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { Auth } from '../../../../core/services/auth';
import { RideResponse } from '../../../../core/models/ride.model';
import { Ride } from '../../../../core/services/ride';
import { Driver } from '../../../../core/services/driver';
import { Websocket } from '../../../../core/services/websocket';
import {
  DriverLocationSnapshot,
  LocationTrackingService
} from '../../../../core/services/location-tracking';
import { RideMap } from '../../../../shared/components/ride-map/ride-map';
import { InAppNotifications } from '../../../../core/services/in-app-notifications';

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RideMap
  ],
  templateUrl: './driver-dashboard.html',
  styleUrl: './driver-dashboard.scss',
})
export class DriverDashboard implements OnInit, OnDestroy {
  user = inject(Auth).getCurrentUser();

  isOnline = false;
  isTogglingStatus = false;
  availableRides: RideResponse[] = [];
  activeRide: RideResponse | null = null;
  tripHistory: RideResponse[] = [];
  view: 'rides' | 'history' = 'rides';
  errorMessage = '';
  driverLocation: DriverLocationSnapshot | null = null;

  private currentLat = 28.6139;
  private currentLng = 77.2090;
  private wsStatusSub: Subscription | null = null;
  private notificationSub: Subscription | null = null;
  private locationSub: Subscription | null = null;

  constructor(
    private authService: Auth,
    private rideService: Ride,
    private driverService: Driver,
    private wsService: Websocket,
    private locationTrackingService: LocationTrackingService,
    private notifications: InAppNotifications
  ) {}

  get completedTrips(): number {
    return this.tripHistory.filter(ride => ride.status === 'COMPLETED').length;
  }

  ngOnInit(): void {
    this.locationSub = this.locationTrackingService.location$.subscribe(location => {
      this.driverLocation = location;
      if (location) {
        this.currentLat = location.latitude;
        this.currentLng = location.longitude;
      }
    });

    this.wsService.connect();

    this.wsStatusSub = this.wsService.status$
      .pipe(
        filter(status => status === 'CONNECTED'),
        take(1)
      )
      .subscribe(() => {
        this.notificationSub = this.wsService.subscribe<any>('/user/queue/notifications')
          .subscribe(notification => {
            if (notification.type === 'RIDE_ASSIGNED') {
              this.activeRide = notification.data;
              this.view = 'rides';
              this.syncLocationTracking();
              this.notifications.show(
                'New ride assigned',
                `${notification.data?.riderName ?? 'A rider'} has been matched with you.`,
                'success'
              );
            }
          });

        this.restoreDriverStatus();
      });

    this.loadMyRides();
  }

  ngOnDestroy(): void {
    this.wsStatusSub?.unsubscribe();
    this.notificationSub?.unsubscribe();
    this.locationSub?.unsubscribe();
  }

  async toggleOnline(): Promise<void> {
    this.isTogglingStatus = true;
    const nextStatus = !this.isOnline;

    try {
      const position = await this.locationTrackingService.getCurrentLocation();
      this.currentLat = position.latitude;
      this.currentLng = position.longitude;
      this.driverLocation = position;

      this.driverService.updateLocation(this.currentLat, this.currentLng, nextStatus)
        .subscribe({
          next: () => {
            this.isOnline = nextStatus;
            this.isTogglingStatus = false;
            if (this.isOnline) {
              this.loadAvailableRides();
              this.notifications.show('You are online', 'You will keep receiving trips until you go offline.', 'success');
            } else {
              this.availableRides = [];
              this.notifications.show('You are offline', 'Trip requests are paused.', 'warning');
            }
          },
          error: () => {
            this.errorMessage = 'Unable to update your live location.';
            this.isTogglingStatus = false;
          }
        });
    } catch {
      this.errorMessage = 'Allow location access to update your online status.';
      this.isTogglingStatus = false;
    }
  }

  loadAvailableRides(): void {
    if (!this.isOnline) {
      this.availableRides = [];
      return;
    }

    this.rideService.getAvailableRides().subscribe({
      next: (rides) => { this.availableRides = rides; }
    });
  }

  acceptRide(rideId: string): void {
    this.rideService.acceptRide(rideId).subscribe({
      next: (ride) => {
        this.activeRide = ride;
        this.availableRides = [];
        this.syncLocationTracking();
        this.notifications.show('Ride accepted', 'Pickup details are now live on the map.', 'success');
      }
    });
  }

  updateStatus(status: string): void {
    if (!this.activeRide) return;

    this.rideService.updateRideStatus(this.activeRide.id, status).subscribe({
      next: (ride) => {
        this.activeRide = ride;
        this.notifications.show('Trip updated', this.statusDescription(ride.status), 'info');
        if (ride.status === 'COMPLETED' || ride.status === 'CANCELLED') {
          this.locationTrackingService.stopTracking();
          this.activeRide = null;
          this.loadMyRides();
          if (this.isOnline) {
            this.loadAvailableRides();
          }
          return;
        }

        this.syncLocationTracking();
      }
    });
  }

  loadMyRides(): void {
    const activeStatuses = ['REQUESTED', 'ACCEPTED', 'PICKED_UP', 'IN_PROGRESS'];
    this.rideService.getMyTrips().subscribe({
      next: (rides) => {
        this.activeRide = rides.find(r => activeStatuses.includes(r.status)) || null;
        this.tripHistory = rides.filter(r => !activeStatuses.includes(r.status));
        this.syncLocationTracking();
      }
    });
  }

  nextStatusLabel(): string {
    const labels: Record<string, string> = {
      ACCEPTED: 'Mark as picked up',
      PICKED_UP: 'Start ride',
      IN_PROGRESS: 'Complete ride'
    };
    return this.activeRide ? (labels[this.activeRide.status] ?? '') : '';
  }

  nextStatus(): string {
    const map: Record<string, string> = {
      ACCEPTED: 'PICKED_UP',
      PICKED_UP: 'IN_PROGRESS',
      IN_PROGRESS: 'COMPLETED'
    };
    return this.activeRide ? (map[this.activeRide.status] ?? '') : '';
  }

  logout(): void {
    this.locationTrackingService.stopTracking();
    this.wsService.disconnect();
    this.authService.logout();
  }

  private restoreDriverStatus(): void {
    this.driverService.getStatus().subscribe({
      next: async (status) => {
        this.isOnline = status.online;

        if (typeof status.latitude === 'number' && typeof status.longitude === 'number') {
          this.currentLat = status.latitude;
          this.currentLng = status.longitude;
        }

        if (!this.isOnline) {
          return;
        }

        try {
          const position = await this.locationTrackingService.getCurrentLocation();
          this.currentLat = position.latitude;
          this.currentLng = position.longitude;
          this.driverLocation = position;
          this.driverService.updateLocation(this.currentLat, this.currentLng, true).subscribe();
        } catch {
          // Keep prior persisted state even if fresh GPS access is denied.
        }

        this.loadAvailableRides();
      }
    });
  }

  private syncLocationTracking(): void {
    if (this.activeRide) {
      this.locationTrackingService.startTracking(this.activeRide.id);
      return;
    }

    if (this.locationTrackingService.isTracking) {
      this.locationTrackingService.stopTracking();
    }
  }

  private statusDescription(status: string): string {
    const labels: Record<string, string> = {
      ACCEPTED: 'Head to pickup and keep your location live.',
      PICKED_UP: 'Rider is onboard. Start the trip when you move.',
      IN_PROGRESS: 'Trip is in progress.',
      COMPLETED: 'Trip completed successfully.',
      CANCELLED: 'This trip was cancelled.'
    };

    return labels[status] ?? status;
  }
}
