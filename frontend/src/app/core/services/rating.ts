// src/app/core/services/rating.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';


export interface SubmitRatingRequest {
  rideId: string;
  stars: number;
  comment?: string;
}

export interface RatingResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class Rating {
  private readonly api = `${environment.apiUrl}/ratings`;

  constructor(private http: HttpClient) {}

  submitRating(request: SubmitRatingRequest): Observable<RatingResponse> {
    return this.http.post<RatingResponse>(this.api, request);
  }
}
