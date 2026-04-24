import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NearbyDriver, RideStatus } from '../../../core/models/ride.model';

declare const google: any;

type MapCoordinate = { lat: number; lng: number };
type DriverPosition = { latitude: number; longitude: number } | null;

@Component({
  selector: 'app-ride-map',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="map-container">
      <div #mapEl class="map-canvas"></div>

      <div class="map-summary" *ngIf="routeDistanceLabel || routeDurationLabel || fare !== null">
        <div class="summary-chip" *ngIf="routeDistanceLabel">{{ routeDistanceLabel }}</div>
        <div class="summary-chip" *ngIf="routeDurationLabel">{{ routeDurationLabel }}</div>
        <div class="summary-chip" *ngIf="fare !== null">₹{{ fare | number:'1.0-0' }}</div>
      </div>

      <div class="map-badge" *ngIf="statusLabel">
        {{ statusLabel }}
      </div>

      <div class="map-legend">
        <div class="legend-item">
          <span class="dot pickup"></span> Pickup
        </div>
        <div class="legend-item">
          <span class="dot drop"></span> Drop
        </div>
        <div class="legend-item" *ngIf="driverPosition">
          <span class="dot driver"></span> Driver live
        </div>
        <div class="legend-item" *ngIf="nearbyDrivers.length">
          <span class="dot nearby"></span> Nearby drivers
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .map-container { position: relative; width: 100%; height: 100%; overflow: hidden; }
    .map-canvas { width: 100%; height: 100%; }
    .map-summary {
      position: absolute;
      top: 16px;
      left: 16px;
      display: flex;
      gap: 8px;
      z-index: 10;
      flex-wrap: wrap;
    }
    .summary-chip,
    .map-badge {
      background: rgba(9, 16, 29, 0.9);
      color: #f8fafc;
      border-radius: 999px;
      padding: 10px 14px;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18);
      backdrop-filter: blur(6px);
    }
    .map-badge {
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 10;
    }
    .map-legend {
      position: absolute;
      bottom: 16px;
      left: 16px;
      background: rgba(255, 255, 255, 0.92);
      border-radius: 14px;
      padding: 10px 12px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
      display: flex;
      flex-direction: column;
      gap: 6px;
      z-index: 10;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #0f172a;
      white-space: nowrap;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
    .dot.pickup { background: #16a34a; }
    .dot.drop { background: #ef4444; }
    .dot.driver { background: #2563eb; }
    .dot.nearby { background: #0ea5e9; }
  `]
})
export class RideMap implements AfterViewInit, OnChanges {
  @ViewChild('mapEl', { static: false }) mapEl!: ElementRef;

  @Input() pickupLat: number | null = null;
  @Input() pickupLng: number | null = null;
  @Input() dropLat: number | null = null;
  @Input() dropLng: number | null = null;
  @Input() driverPosition: DriverPosition = null;
  @Input() rideStatus: RideStatus | 'PREVIEW' | null = null;
  @Input() nearbyDrivers: NearbyDriver[] = [];
  @Input() fare: number | null = null;
  @Input() etaMinutes: number | null = null;
  @Input() distanceKm: number | null = null;

  mapLoaded = false;
  mapError = false;
  routeDistanceLabel = '';
  routeDurationLabel = '';
  statusLabel = '';

  private map: any;
  private pickupMarker: any;
  private dropMarker: any;
  private driverMarker: any;
  private nearbyDriverMarkers: any[] = [];
  private directionsService: any;
  private directionsRenderer: any;
  private fallbackLine: any;
  private animationTimer: ReturnType<typeof setInterval> | null = null;
  private fitBoundsPending = true;

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mapLoaded || !this.map) {
      return;
    }

    if (
      changes['pickupLat'] ||
      changes['pickupLng'] ||
      changes['dropLat'] ||
      changes['dropLng'] ||
      changes['rideStatus']
    ) {
      this.fitBoundsPending = true;
    }

    this.refreshMap();
  }

  private initMap(): void {
    if (typeof google === 'undefined' || !this.mapEl?.nativeElement) {
      this.mapError = true;
      return;
    }

    this.map = new google.maps.Map(this.mapEl.nativeElement, {
      center: this.getInitialCenter(),
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: this.getMapStyles()
    });

    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      map: this.map,
      suppressMarkers: true,
      preserveViewport: true,
      polylineOptions: {
        strokeColor: '#111827',
        strokeOpacity: 0.9,
        strokeWeight: 6
      }
    });

    this.fallbackLine = new google.maps.Polyline({
      geodesic: true,
      strokeColor: '#111827',
      strokeOpacity: 0.6,
      strokeWeight: 4
    });
    this.fallbackLine.setMap(this.map);

    this.mapLoaded = true;
    this.refreshMap();
  }

  private refreshMap(): void {
    if (!this.hasCoordinate(this.pickupLat, this.pickupLng) || !this.hasCoordinate(this.dropLat, this.dropLng)) {
      return;
    }

    this.statusLabel = this.resolveStatusLabel();
    this.ensureEndpointMarkers();
    this.syncNearbyDrivers();
    this.syncDriverMarker();
    this.renderRoute();
  }

  private renderRoute(): void {
    if (!this.directionsService || !this.directionsRenderer) {
      return;
    }

    const origin = this.getRouteOrigin();
    const destination = this.getRouteDestination();

    this.directionsService.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS
        }
      },
      (result: any, status: string) => {
        if (status === 'OK' && result?.routes?.length) {
          this.directionsRenderer.setDirections(result);
          this.fallbackLine.setPath([]);
          const leg = result.routes[0]?.legs?.[0];
          this.routeDistanceLabel = leg?.distance?.text ?? this.formatDistance(this.distanceKm);
          this.routeDurationLabel = this.etaMinutes ? `${this.etaMinutes} min ETA` : (leg?.duration_in_traffic?.text ?? leg?.duration?.text ?? '');
          this.fitVisibleBounds();
          return;
        }

        this.directionsRenderer.set('directions', null);
        this.fallbackLine.setPath([origin, destination]);
        this.routeDistanceLabel = this.formatDistance(this.distanceKm);
        this.routeDurationLabel = this.etaMinutes ? `${this.etaMinutes} min ETA` : '';
        this.fitVisibleBounds();
      }
    );
  }

  private ensureEndpointMarkers(): void {
    this.pickupMarker ??= new google.maps.Marker({
      map: this.map,
      title: 'Pickup',
      icon: this.buildCircle('#16a34a')
    });
    this.dropMarker ??= new google.maps.Marker({
      map: this.map,
      title: 'Drop',
      icon: this.buildCircle('#ef4444')
    });

    this.pickupMarker.setPosition({ lat: this.pickupLat!, lng: this.pickupLng! });
    this.dropMarker.setPosition({ lat: this.dropLat!, lng: this.dropLng! });
  }

  private syncDriverMarker(): void {
    if (!this.driverPosition) {
      if (this.driverMarker) {
        this.driverMarker.setMap(null);
        this.driverMarker = null;
      }
      return;
    }

    const nextPosition = {
      lat: this.driverPosition.latitude,
      lng: this.driverPosition.longitude
    };

    if (!this.driverMarker) {
      this.driverMarker = new google.maps.Marker({
        position: nextPosition,
        map: this.map,
        title: 'Driver',
        zIndex: 5,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">
              <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.28"/>
                </filter>
              </defs>
              <g filter="url(#shadow)">
                <circle cx="26" cy="26" r="18" fill="#2563eb" stroke="white" stroke-width="4"/>
                <path d="M18 27h16l-2-6a3 3 0 0 0-2.8-2h-6.4a3 3 0 0 0-2.8 2l-2 6Zm3 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm10 0a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" fill="white"/>
              </g>
            </svg>
          `),
          scaledSize: new google.maps.Size(46, 46),
          anchor: new google.maps.Point(23, 23)
        }
      });
      return;
    }

    this.animateMarker(this.driverMarker, nextPosition);
  }

  private syncNearbyDrivers(): void {
    this.nearbyDriverMarkers.forEach(marker => marker.setMap(null));
    this.nearbyDriverMarkers = [];

    this.nearbyDrivers.forEach((driver) => {
      const marker = new google.maps.Marker({
        position: { lat: driver.latitude, lng: driver.longitude },
        map: this.map,
        zIndex: 3,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r="10" fill="#e0f2fe" stroke="#0ea5e9" stroke-width="2"/>
              <path d="M9 15h10l-1.2-3.6a2 2 0 0 0-1.9-1.4h-3.8a2 2 0 0 0-1.9 1.4L9 15Zm2 1.2a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Zm6 0a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Z" fill="#0284c7"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(28, 28),
          anchor: new google.maps.Point(14, 14)
        }
      });

      marker.addListener('click', () => {
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="font-family:Arial,sans-serif;padding:4px 6px;">
              <strong>${driver.driverName}</strong><br/>
              ${driver.etaMinutes} min away • ${this.formatDistance(driver.distanceKm)}
            </div>
          `
        });
        infoWindow.open(this.map, marker);
      });

      this.nearbyDriverMarkers.push(marker);
    });
  }

  private fitVisibleBounds(): void {
    if (!this.fitBoundsPending) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: this.pickupLat!, lng: this.pickupLng! });
    bounds.extend({ lat: this.dropLat!, lng: this.dropLng! });

    if (this.driverPosition) {
      bounds.extend({ lat: this.driverPosition.latitude, lng: this.driverPosition.longitude });
    }

    this.nearbyDrivers.forEach((driver) => {
      bounds.extend({ lat: driver.latitude, lng: driver.longitude });
    });

    this.map.fitBounds(bounds, 80);
    this.fitBoundsPending = false;
  }

  private getRouteOrigin(): MapCoordinate {
    if (
      this.driverPosition &&
      (this.rideStatus === 'ACCEPTED' || this.rideStatus === 'PICKED_UP' || this.rideStatus === 'IN_PROGRESS')
    ) {
      return {
        lat: this.driverPosition.latitude,
        lng: this.driverPosition.longitude
      };
    }

    return { lat: this.pickupLat!, lng: this.pickupLng! };
  }

  private getRouteDestination(): MapCoordinate {
    if (this.driverPosition && this.rideStatus === 'ACCEPTED') {
      return { lat: this.pickupLat!, lng: this.pickupLng! };
    }

    return { lat: this.dropLat!, lng: this.dropLng! };
  }

  private getInitialCenter(): MapCoordinate {
    if (this.hasCoordinate(this.pickupLat, this.pickupLng)) {
      return { lat: this.pickupLat!, lng: this.pickupLng! };
    }

    return { lat: 28.6139, lng: 77.2090 };
  }

  private animateMarker(marker: any, target: MapCoordinate): void {
    const start = marker.getPosition();
    if (!start) {
      marker.setPosition(target);
      return;
    }

    if (this.animationTimer) {
      clearInterval(this.animationTimer);
    }

    const startLat = start.lat();
    const startLng = start.lng();
    const frames = 24;
    let frame = 0;

    this.animationTimer = setInterval(() => {
      frame += 1;
      const progress = frame / frames;

      marker.setPosition({
        lat: startLat + (target.lat - startLat) * progress,
        lng: startLng + (target.lng - startLng) * progress
      });

      if (frame >= frames && this.animationTimer) {
        clearInterval(this.animationTimer);
        this.animationTimer = null;
      }
    }, 40);
  }

  private resolveStatusLabel(): string {
    if (this.rideStatus === 'PREVIEW') {
      return this.nearbyDrivers.length ? `${this.nearbyDrivers.length} drivers nearby` : 'Preview route';
    }

    const labels: Record<string, string> = {
      REQUESTED: 'Searching for a driver',
      ACCEPTED: 'Driver en route to pickup',
      PICKED_UP: 'Driver has arrived',
      IN_PROGRESS: 'Trip in progress',
      COMPLETED: 'Ride completed',
      CANCELLED: 'Ride cancelled'
    };

    return this.rideStatus ? labels[this.rideStatus] ?? this.rideStatus : '';
  }

  private buildCircle(fillColor: string): any {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3
    };
  }

  private formatDistance(distanceKm: number | null | undefined): string {
    if (distanceKm === null || distanceKm === undefined || Number.isNaN(distanceKm)) {
      return '';
    }

    return `${distanceKm.toFixed(1)} km`;
  }

  private hasCoordinate(lat: number | null, lng: number | null): lat is number {
    return Number.isFinite(lat) && Number.isFinite(lng);
  }

  private getMapStyles(): any[] {
    return [
      { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
      { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
      { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#e2e8f0' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
      { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#e2e8f0' }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#cbd5e1' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbeafe' }] }
    ];
  }
}
