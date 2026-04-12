import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Driver {


  private readonly api = `${environment.apiUrl}/driver`;

  constructor(private http: HttpClient) {}

  updateLocation(lat: number, lng: number, isAvailable: boolean): Observable<void> {
    return this.http.put<void>(`${this.api}/location`, {
      latitude: lat,
      longitude: lng,
      isAvailable
    });
  }
  
}
