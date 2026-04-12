import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Auth } from '../../../../core/services/auth';
import { RideResponse, VehicleType } from '../../../../core/models/ride.model';
import { Ride } from '../../../../core/services/ride';

@Component({
  selector: 'app-rider-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rider-dashboard.html',
  styleUrl: './rider-dashboard.scss',
})
export class RiderDashboard implements OnInit{

  user= inject(Auth).getCurrentUser();
  bookingForm:FormGroup;

  activeRide:RideResponse | null = null;
  rideHistory:RideResponse[] = [];
  isBooking = false;
  isLoadingHistory = false;
  errorMessage = '';
  view: 'book' | 'history' = 'book';


  vehicles: { type: VehicleType; label: string; icon: string; desc: string }[] = [
    { type: 'BIKE',  label: 'Bike',  icon: '🏍️', desc: 'Fastest & cheapest' },
    { type: 'AUTO',  label: 'Auto',  icon: '🛺', desc: 'Comfortable & affordable' },
    { type: 'CAR',   label: 'Car',   icon: '🚗', desc: 'Premium & AC' }
  ];

  
  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private rideService: Ride
  ) {
    this.bookingForm = this.fb.group({
      pickupAddress: ['', Validators.required],
      pickupLat:     [28.6139, Validators.required],   // default: New Delhi
      pickupLng:     [77.2090, Validators.required],
      dropAddress:   ['', Validators.required],
      dropLat:       [28.5355, Validators.required],   // default: South Delhi
      dropLng:       [77.3910, Validators.required],
      vehicleType:   ['BIKE',  Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadHistory();
  }

   selectVehicle(type: VehicleType): void {
    this.bookingForm.patchValue({ vehicleType: type });
  }

  bookRide():void{
    if (this.bookingForm.invalid) { this.bookingForm.markAllAsTouched(); return; }

    this.isBooking = true;
    this.errorMessage = '';

    this.rideService.bookRide(this.bookingForm.value).subscribe({
      next: (ride) => {
        this.activeRide = ride;
        this.isBooking = false;
        this.loadHistory();
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Booking failed. Try again.';
        this.isBooking = false;
      }
  });

  }

  cancelRide(): void {
    if (!this.activeRide) return;
    this.rideService.cancelRide(this.activeRide.id, 'Cancelled by rider').subscribe({
      next: () => { this.activeRide = null; this.loadHistory(); },
      error: (err) => { this.errorMessage = err.error?.error || 'Could not cancel ride.'; }
    });
  }


  loadHistory(): void {
    this.isLoadingHistory = true;
    this.rideService.getMyRides().subscribe({
      next: (rides) => {
        // separate active from history
        const activeStatuses = ['REQUESTED', 'ACCEPTED', 'PICKED_UP', 'IN_PROGRESS'];
        this.activeRide = rides.find(r => activeStatuses.includes(r.status)) || null;
        this.rideHistory = rides.filter(r => !activeStatuses.includes(r.status));
        this.isLoadingHistory = false;
      },
      error: () => { this.isLoadingHistory = false; }
    });
  }

  refreshRide(): void {
    if (!this.activeRide) return;
    this.rideService.getRide(this.activeRide.id).subscribe({
      next: (ride) => { this.activeRide = ride; }
    });
  }

   logout(): void { this.authService.logout(); }

   statusLabel(status: string): string {
    const labels: Record<string, string> = {
      REQUESTED: '🔍 Finding your driver...',
      ACCEPTED: '🚗 Driver is on the way',
      PICKED_UP: '✅ Driver arrived',
      IN_PROGRESS: '🛣️ Ride in progress',
      COMPLETED: '🎉 Completed',
      CANCELLED: '❌ Cancelled'
    };
    return labels[status] ?? status;
  }

}

