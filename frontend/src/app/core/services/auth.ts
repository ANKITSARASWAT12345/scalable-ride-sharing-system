import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class Auth {

  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());

  // public observable — components subscribe to this to react when login state changes
  currentUser$ = this.currentUserSubject.asObservable();

  private get isBrowser(): boolean {
    return typeof globalThis !== 'undefined' && typeof globalThis.localStorage !== 'undefined';
  }

  private get storage(): Storage | null {
    return this.isBrowser ? globalThis.localStorage : null;
  }


  constructor(private http: HttpClient, private router:Router) {}


 register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(response => this.handleAuthSuccess(response))
      // tap = "do this side effect without changing the data"
      // after register, automatically store tokens and update current user
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }


  logout(): void {
    // clear everything from storage
    this.storage?.removeItem('accessToken');
    this.storage?.removeItem('refreshToken');
    this.storage?.removeItem('currentUser');

    // tell all subscribers that no one is logged in
    this.currentUserSubject.next(null);

    // send to login page
    this.router.navigate(['/auth/login']);
  }


  getAccessToken(): string | null {
    return this.storage?.getItem('accessToken') ?? null;
  }

  isLoggedIn(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isRider(): boolean {
    return this.getCurrentUser()?.role === 'RIDER';
  }

  isDriver(): boolean {
    return this.getCurrentUser()?.role === 'DRIVER';
  }

  private handleAuthSuccess(response: AuthResponse): void {
    // store tokens in localStorage — persists across browser refreshes
    this.storage?.setItem('accessToken', response.accessToken);
    this.storage?.setItem('refreshToken', response.refreshToken);

    // build the user object from the response
    const user: User = {
      userId: response.userId,
      name: response.name,
      email: response.email,
      role: response.role
    };

    this.storage?.setItem('currentUser', JSON.stringify(user));

    // notify all subscribers (components) that a user is now logged in
    this.currentUserSubject.next(user);
  }

  private getUserFromStorage(): User | null {
    // called on app startup — restores user from localStorage if already logged in
    const userStr = this.storage?.getItem('currentUser');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      // exp is in seconds, Date.now() is in milliseconds
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;  // if we can't decode it, treat it as expired
    }
  }

  
}
