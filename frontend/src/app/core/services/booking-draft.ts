import { Injectable } from '@angular/core';
import { BookingDraftState, LocationSelection } from '../models/location.model';
import { VehicleType } from '../models/ride.model';

@Injectable({
  providedIn: 'root',
})
export class BookingDraft {
  private readonly draftKey = 'ridex.booking-draft';
  private readonly currentLocationKey = 'ridex.current-location';

  private get isBrowser(): boolean {
    return typeof globalThis !== 'undefined' && typeof globalThis.localStorage !== 'undefined';
  }

  private get storage(): Storage | null {
    return this.isBrowser ? globalThis.localStorage : null;
  }

  getDraft(): BookingDraftState {
    const defaultDraft: BookingDraftState = {
      pickup: null,
      drop: null,
      vehicleType: 'BIKE',
    };

    const rawDraft = this.storage?.getItem(this.draftKey);
    if (!rawDraft) {
      return defaultDraft;
    }

    try {
      return {
        ...defaultDraft,
        ...JSON.parse(rawDraft),
      };
    } catch {
      return defaultDraft;
    }
  }

  setPickup(location: LocationSelection | null): void {
    this.saveDraft({ pickup: location });
  }

  setDrop(location: LocationSelection | null): void {
    this.saveDraft({ drop: location });
  }

  setVehicleType(vehicleType: VehicleType): void {
    this.saveDraft({ vehicleType });
  }

  setCurrentLocation(location: LocationSelection | null): void {
    if (!this.storage) {
      return;
    }

    if (!location) {
      this.storage.removeItem(this.currentLocationKey);
      return;
    }

    this.storage.setItem(this.currentLocationKey, JSON.stringify(location));
  }

  getCurrentLocation(): LocationSelection | null {
    const rawLocation = this.storage?.getItem(this.currentLocationKey);
    if (!rawLocation) {
      return null;
    }

    try {
      return JSON.parse(rawLocation) as LocationSelection;
    } catch {
      return null;
    }
  }

  private saveDraft(partialDraft: Partial<BookingDraftState>): void {
    if (!this.storage) {
      return;
    }

    const nextDraft = {
      ...this.getDraft(),
      ...partialDraft,
    };

    this.storage.setItem(this.draftKey, JSON.stringify(nextDraft));
  }
}
