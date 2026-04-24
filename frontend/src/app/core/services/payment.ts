// src/app/core/services/payment.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface WalletResponse {
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

@Injectable({ providedIn: 'root' })
export class Payment {

  private readonly api = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  getWallet(): Observable<WalletResponse> {
    return this.http.get<WalletResponse>(`${this.api}/wallet`);
  }

  topUpWallet(amount: number): Promise<WalletResponse> {
    return firstValueFrom(
      this.http.post<WalletResponse>(`${this.api}/wallet/top-up`, { amount })
    );
  }
}
