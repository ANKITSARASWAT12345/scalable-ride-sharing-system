import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { HttpClient } from '@angular/common/http';
import { BookRideRequest, NearbyDriver, RideResponse, VehicleType } from '../models/ride.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Ride {


  private readonly api=  `${environment.apiUrl}/rides`;


  constructor(private http:HttpClient) { }


  bookRide(request:BookRideRequest):Observable<RideResponse> {
    return this.http.post<RideResponse>(`${this.api}/book`, request);
  }

  getMyRides(): Observable<RideResponse[]> {
    return this.http.get<RideResponse[]>(`${this.api}/my-rides`);
  }

  getNearbyDrivers(lat: number, lng: number, vehicleType: VehicleType): Observable<NearbyDriver[]> {
    return this.http.get<NearbyDriver[]>(`${this.api}/nearby-drivers`, {
      params: {
        lat,
        lng,
        vehicleType
      }
    });
  }

  cancelRide(rideId: string, reason: string): Observable<RideResponse> {
    return this.http.post<RideResponse>(
      `${this.api}/${rideId}/cancel?reason=${encodeURIComponent(reason)}`, {}
    );
  }

   getRide(rideId: string): Observable<RideResponse> {
    return this.http.get<RideResponse>(`${this.api}/${rideId}`);
  }

  // Driver actions
  getAvailableRides(): Observable<RideResponse[]> {
    return this.http.get<RideResponse[]>(`${this.api}/available`);
  }

  acceptRide(rideId: string): Observable<RideResponse> {
    return this.http.post<RideResponse>(`${this.api}/${rideId}/accept`, {});
  }

  updateRideStatus(rideId: string, status: string): Observable<RideResponse> {
    return this.http.patch<RideResponse>(`${this.api}/${rideId}/status?status=${status}`, {});
  }

  getMyTrips(): Observable<RideResponse[]> {
    return this.http.get<RideResponse[]>(`${this.api}/my-trips`);
  }

  
}
