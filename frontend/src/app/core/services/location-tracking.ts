import { isPlatformBrowser } from '@angular/common';
import { Injectable, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { Auth } from './auth';
import { Websocket } from './websocket';
import { BehaviorSubject } from 'rxjs';

export interface DriverLocationSnapshot {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class LocationTrackingService implements OnDestroy {

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private watchId: number | null = null;
  private currentRideId: string | null = null;
  private lastPublishedAt = 0;
  private readonly locationSubject = new BehaviorSubject<DriverLocationSnapshot | null>(null);

  isTracking = false;
  readonly location$ = this.locationSubject.asObservable();

  constructor(
    private wsService: Websocket,   // ✅ fixed type
    private authService: Auth
  ) {}

  // Start tracking driver location
  startTracking(rideId: string): void {
    this.currentRideId = rideId;
    this.isTracking = true;
    this.ensureLocationWatcher();
    this.getCurrentLocation().then(location => {
      this.locationSubject.next(location);
      this.publishLocation(location);
    }).catch(error => {
      console.warn('Geolocation error:', error.message);
    });
  }

  // Stop tracking
  stopTracking(): void {
    this.currentRideId = null;
    this.isTracking = false;
    this.stopWatcher();
  }

  async getCurrentLocation(): Promise<DriverLocationSnapshot> {
    if (!this.isBrowser || !navigator.geolocation) {
      throw new Error('Geolocation is not available in this environment');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp || Date.now(),
          });
        },
        reject,
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 2000,
        }
      );
    });
  }

  private ensureLocationWatcher(): void {
    if (!this.isBrowser || this.watchId !== null || !navigator.geolocation) {
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const snapshot: DriverLocationSnapshot = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp || Date.now(),
        };

        this.locationSubject.next(snapshot);
        this.publishLocation(snapshot);
      },
      (error) => {
        console.warn('Geolocation watch error:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
      }
    );
  }

  private stopWatcher(): void {
    if (!this.isBrowser || this.watchId === null || this.isTracking) {
      return;
    }

    navigator.geolocation.clearWatch(this.watchId);
    this.watchId = null;
  }

  private publishLocation(location: DriverLocationSnapshot): void {
    if (!this.currentRideId) return;

    const user = this.authService.getCurrentUser();
    if (!user) return;

    const now = Date.now();
    if (now - this.lastPublishedAt < 1500) {
      return;
    }

    this.lastPublishedAt = now;
    this.wsService.publish('/app/driver.location', {
      rideId: this.currentRideId,
      driverId: user.userId,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      timestamp: location.timestamp,
    });
  }

  // Cleanup when service destroyed
  ngOnDestroy(): void {
    this.stopTracking();
  }
}
