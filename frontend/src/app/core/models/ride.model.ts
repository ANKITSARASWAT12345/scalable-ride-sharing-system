export type RideStatus =
  | 'REQUESTED' | 'ACCEPTED' | 'PICKED_UP'
  | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type VehicleType = 'BIKE' | 'AUTO' | 'CAR';

export interface RideResponse {
  id: string;
  riderId: string;
  riderName: string;
  driverId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropAddress: string;
  dropLat: number;
  dropLng: number;
  status: RideStatus;
  fare: number | null;
  distanceKm: number;
  vehicleType: VehicleType;
  requestedAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  surgeMultiplier?: number;
  etaMinutes?: number | null;
}

export interface NearbyDriver {
  driverId: string;
  driverName: string;
  latitude: number;
  longitude: number;
  vehicleType: VehicleType;
  rating: number;
  distanceKm: number;
  etaMinutes: number;
}

export interface BookRideRequest {
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropAddress: string;
  dropLat: number;
  dropLng: number;
  vehicleType: VehicleType;
}

