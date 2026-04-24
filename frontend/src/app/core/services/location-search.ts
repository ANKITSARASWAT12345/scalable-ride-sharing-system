import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, from, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environments';
import { LocationSelection, LocationSuggestion } from '../models/location.model';

declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class LocationSearch {
  private readonly api = `${environment.apiUrl}/locations`;
  private autocompleteService: any;
  private placesService: any;
  private geocoder: any;

  constructor(private http: HttpClient) {}

  getFeaturedLocations(): Observable<LocationSuggestion[]> {
    return this.http.get<LocationSuggestion[]>(`${this.api}/featured`).pipe(
      map((locations) => locations.map((location) => this.fromBackend(location))),
      catchError(() => of([]))
    );
  }

  searchLocations(query: string): Observable<LocationSuggestion[]> {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return this.getFeaturedLocations();
    }

    return forkJoin({
      backend: this.http.get<LocationSuggestion[]>(`${this.api}/suggestions`, {
        params: {
          query: trimmedQuery,
          limit: '6',
        },
      }).pipe(
        map((locations) => locations.map((location) => this.fromBackend(location))),
        catchError(() => of([]))
      ),
      google: from(this.searchGooglePredictions(trimmedQuery)).pipe(
        catchError(() => of([] as LocationSuggestion[]))
      ),
    }).pipe(
      map(({ backend, google: googleSuggestions }) =>
        this.dedupeSuggestions([...googleSuggestions, ...backend]).slice(0, 8)
      )
    );
  }

  async resolveSuggestion(suggestion: LocationSuggestion): Promise<LocationSelection | null> {
    if (Number.isFinite(suggestion.latitude) && Number.isFinite(suggestion.longitude)) {
      return {
        address: [suggestion.title, suggestion.subtitle].filter(Boolean).join(', '),
        latitude: suggestion.latitude as number,
        longitude: suggestion.longitude as number,
      };
    }

    if (suggestion.placeId) {
      return this.getPlaceDetails(suggestion.placeId);
    }

    return this.geocodeAddress([suggestion.title, suggestion.subtitle].filter(Boolean).join(', '));
  }

  async geocodeAddress(address: string): Promise<LocationSelection | null> {
    const googleReady = await this.ensureGoogleMaps();
    if (!googleReady || !address.trim()) {
      return null;
    }

    return new Promise((resolve) => {
      this.geocoder.geocode({ address }, (results: any[], status: string) => {
        if (status !== 'OK' || !results?.[0]?.geometry?.location) {
          resolve(null);
          return;
        }

        const location = results[0].geometry.location;
        resolve({
          address: results[0].formatted_address || address,
          latitude: location.lat(),
          longitude: location.lng(),
        });
      });
    });
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<LocationSelection> {
    const googleReady = await this.ensureGoogleMaps();

    if (!googleReady) {
      return {
        address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        latitude,
        longitude,
      };
    }

    return new Promise((resolve) => {
      this.geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results: any[], status: string) => {
        if (status !== 'OK' || !results?.[0]?.formatted_address) {
          resolve({
            address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            latitude,
            longitude,
          });
          return;
        }

        resolve({
          address: results[0].formatted_address,
          latitude,
          longitude,
        });
      });
    });
  }

  private async searchGooglePredictions(query: string): Promise<LocationSuggestion[]> {
    const googleReady = await this.ensureGoogleMaps();
    if (!googleReady) {
      return [];
    }

    return new Promise((resolve) => {
      this.autocompleteService.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'in' },
        },
        (predictions: any[], status: string) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions?.length) {
            resolve([]);
            return;
          }

          resolve(
            predictions.map((prediction) => ({
              id: prediction.place_id,
              title: prediction.structured_formatting?.main_text || prediction.description,
              subtitle: prediction.structured_formatting?.secondary_text || '',
              placeId: prediction.place_id,
              type: 'ADDRESS',
              source: 'google' as const,
            }))
          );
        }
      );
    });
  }

  private async getPlaceDetails(placeId: string): Promise<LocationSelection | null> {
    const googleReady = await this.ensureGoogleMaps();
    if (!googleReady) {
      return null;
    }

    return new Promise((resolve) => {
      this.placesService.getDetails(
        {
          placeId,
          fields: ['formatted_address', 'geometry', 'name'],
        },
        (place: any, status: string) => {
          const location = place?.geometry?.location;

          if (status !== google.maps.places.PlacesServiceStatus.OK || !location) {
            resolve(null);
            return;
          }

          resolve({
            address: place.formatted_address || place.name || '',
            latitude: location.lat(),
            longitude: location.lng(),
          });
        }
      );
    });
  }

  private async ensureGoogleMaps(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }

    if (typeof google !== 'undefined' && google?.maps?.places) {
      this.initializeGoogleServices();
      return true;
    }

    return new Promise((resolve) => {
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;

        if (typeof google !== 'undefined' && google?.maps?.places) {
          window.clearInterval(timer);
          this.initializeGoogleServices();
          resolve(true);
          return;
        }

        if (attempts >= 40) {
          window.clearInterval(timer);
          resolve(false);
        }
      }, 250);
    });
  }

  private initializeGoogleServices(): void {
    if (!this.autocompleteService) {
      this.autocompleteService = new google.maps.places.AutocompleteService();
    }

    if (!this.placesService) {
      this.placesService = new google.maps.places.PlacesService(document.createElement('div'));
    }

    if (!this.geocoder) {
      this.geocoder = new google.maps.Geocoder();
    }
  }

  private dedupeSuggestions(suggestions: LocationSuggestion[]): LocationSuggestion[] {
    const seen = new Set<string>();

    return suggestions.filter((suggestion) => {
      const key = `${suggestion.placeId || suggestion.title}-${suggestion.subtitle}`.toLowerCase();
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  private fromBackend(location: LocationSuggestion): LocationSuggestion {
    return {
      ...location,
      source: 'backend',
      type: location.type || 'CITY',
    };
  }
}
