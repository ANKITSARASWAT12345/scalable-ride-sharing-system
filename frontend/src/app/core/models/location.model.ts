import { VehicleType } from './ride.model';

export type LocationSuggestionType =
  | 'ADDRESS'
  | 'AIRPORT'
  | 'BUSINESS_HUB'
  | 'CITY'
  | 'CORRIDOR'
  | 'CURRENT_LOCATION'
  | 'DISTRICT'
  | 'TECH_PARK';

export interface LocationSelection {
  address: string;
  latitude: number;
  longitude: number;
}

export interface LocationSuggestion {
  id: string;
  title: string;
  subtitle: string;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string;
  type: LocationSuggestionType;
  source: 'backend' | 'google';
}

export interface BookingDraftState {
  pickup: LocationSelection | null;
  drop: LocationSelection | null;
  vehicleType: VehicleType;
}
