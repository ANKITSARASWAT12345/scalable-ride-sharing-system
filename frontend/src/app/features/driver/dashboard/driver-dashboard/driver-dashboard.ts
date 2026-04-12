import { Component, inject } from '@angular/core';
import { Auth } from '../../../../core/services/auth';
import { RideResponse } from '../../../../core/models/ride.model';
import { Ride } from '../../../../core/services/ride';
import { Driver } from '../../../../core/services/driver';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-driver-dashboard',
   standalone: true,
  imports: [CommonModule,          // ✅ ngIf, ngFor
    ReactiveFormsModule  ],
  templateUrl: './driver-dashboard.html',
  styleUrl: './driver-dashboard.scss',
})
export class DriverDashboard {

  user= inject(Auth).getCurrentUser();


  isOnline = false;
  isTogglingStatus = false;
  availableRides: RideResponse[] = [];
  activeRide: RideResponse | null = null;
  tripHistory: RideResponse[] = [];
  view: 'rides' | 'history' = 'rides';
  errorMessage = '';


  private currentLat = 28.6139;
  private currentLng = 77.2090;

  constructor(
    private authService: Auth,
    private rideService: Ride,
    private driverService: Driver
  ) {}

  ngOnInit(): void {
    this.loadMyRides();
  }


  toggleOnline(): void {
    this.isTogglingStatus = true;
    const newStatus = !this.isOnline;

    this.driverService.updateLocation(this.currentLat, this.currentLng, newStatus)
      .subscribe({
        next: () => {
          this.isOnline = newStatus;
          this.isTogglingStatus = false;
          if (this.isOnline) this.loadAvailableRides();
        },
        error: () => { this.isTogglingStatus = false; }
      });
  }


    loadAvailableRides(): void {
    this.rideService.getAvailableRides().subscribe({
      next: (rides) => { this.availableRides = rides; }
    });
  }


   acceptRide(rideId: string): void {
    this.rideService.acceptRide(rideId).subscribe({
      next: (ride) => {
        this.activeRide = ride;
        this.availableRides = [];
      },
      error: (err) => { this.errorMessage = err.error?.error || 'Could not accept ride.'; }
    });
  }


  updateStatus(status: string): void {
    if (!this.activeRide) return;
    this.rideService.updateRideStatus(this.activeRide.id, status).subscribe({
      next: (ride) => {
        this.activeRide = ride;
        if (ride.status === 'COMPLETED' || ride.status === 'CANCELLED') {
          this.activeRide = null;
          this.loadMyRides();
        }
      },
      error: (err) => { this.errorMessage = err.error?.error || 'Status update failed.'; }
    });
  }

  loadMyRides(): void {
    const activeStatuses = ['REQUESTED', 'ACCEPTED', 'PICKED_UP', 'IN_PROGRESS'];
    this.rideService.getMyTrips().subscribe({
      next: (rides) => {
        this.activeRide = rides.find(r => activeStatuses.includes(r.status)) || null;
        this.tripHistory = rides.filter(r => !activeStatuses.includes(r.status));
      }
    });
  }

  nextStatusLabel(): string {
    const labels: Record<string, string> = {
      ACCEPTED: 'Mark as Picked Up',
      PICKED_UP: 'Start Ride',
      IN_PROGRESS: 'Complete Ride'
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

  logout(): void { this.authService.logout(); }


  

}
