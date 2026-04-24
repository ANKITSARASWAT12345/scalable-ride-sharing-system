import { isPlatformBrowser } from '@angular/common';
import { Injectable, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { BehaviorSubject, EMPTY, Observable, Subject } from 'rxjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environments';
import { Auth } from './auth';


export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';

@Injectable({
  providedIn: 'root',
})
export class Websocket implements OnDestroy{

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private client: Client | null = null;

  private subscriptions = new Map<
    string,
    { subject: Subject<unknown>; subscription?: StompSubscription }
  >();


  // Emits the current connection status to any component that subscribes
  private connectionStatus$ = new BehaviorSubject<ConnectionStatus>('DISCONNECTED');
  status$ = this.connectionStatus$.asObservable();
   constructor(private authService: Auth) {
    if (!this.isBrowser) {
      return;
    }

    this.client = this.createClient();
  }


  // Call this once when user logs in
  connect(): void {
    if (!this.client || this.client.connected || this.client.active) {
      return;
    }

    this.connectionStatus$.next('CONNECTING');
    this.client.activate();
  }

  // Call this when user logs out
  disconnect(): void {
    this.subscriptions.forEach((entry) => {
      entry.subscription?.unsubscribe();
      entry.subject.complete();
    });
    this.subscriptions.clear();
    this.client?.deactivate();
    this.connectionStatus$.next('DISCONNECTED');
  }


  // Subscribe to a STOMP topic and return an Observable
  // Components subscribe to this and get messages as they arrive
  subscribe<T>(destination: string): Observable<T> {
    if (!this.client) {
      return EMPTY;
    }

    if (!this.subscriptions.has(destination)) {
      this.subscriptions.set(destination, { subject: new Subject<unknown>() });
    }

    this.ensureSubscription(destination);

    return this.subscriptions.get(destination)!.subject.asObservable() as Observable<T>;
  }

  // Send a message TO the server via WebSocket
  publish(destination: string, body: object): void {
    if (!this.client?.connected) {
      console.warn('WebSocket not connected, cannot publish to', destination);
      return;
    }
    this.client.publish({
      destination,
      body: JSON.stringify(body)
    });
  }

   // Unsubscribe from a specific topic (cleanup)
  unsubscribe(destination: string): void {
    const entry = this.subscriptions.get(destination);
    if (entry) {
      entry.subscription?.unsubscribe();
      entry.subject.complete();
      this.subscriptions.delete(destination);
    }
  }


  ngOnDestroy(): void {
    this.disconnect();
  }

  private createClient(): Client {
    return new Client({
      webSocketFactory: () => new SockJS(`${environment.wsUrl || 'http://localhost:8080'}/ws`),
      beforeConnect: () => {
        if (!this.client) {
          return;
        }

        this.client.connectHeaders = {
          Authorization: `Bearer ${this.authService.getAccessToken() ?? ''}`
        };
      },
      reconnectDelay: 5000,
      onConnect: () => {
        this.connectionStatus$.next('CONNECTED');
        this.resubscribeAll();
        console.log('WebSocket connected');
      },
      onDisconnect: () => {
        this.clearActiveSubscriptions();
        this.connectionStatus$.next('DISCONNECTED');
        console.log('WebSocket disconnected');
      },
      onWebSocketClose: () => {
        this.clearActiveSubscriptions();
        this.connectionStatus$.next('DISCONNECTED');
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame);
        this.connectionStatus$.next('DISCONNECTED');
      }
    });
  }

  private ensureSubscription(destination: string): void {
    if (!this.client?.connected) {
      return;
    }

    const entry = this.subscriptions.get(destination);
    if (!entry || entry.subscription) {
      return;
    }

    entry.subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const body = JSON.parse(message.body);
        entry.subject.next(body);
      } catch (error) {
        console.error('Failed to parse WebSocket message', destination, error);
      }
    });
  }

  private clearActiveSubscriptions(): void {
    this.subscriptions.forEach((entry) => {
      entry.subscription = undefined;
    });
  }

  private resubscribeAll(): void {
    this.subscriptions.forEach((_, destination) => {
      this.ensureSubscription(destination);
    });
  }

}
