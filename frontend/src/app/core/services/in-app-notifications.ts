import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type NotificationTone = 'success' | 'info' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  tone: NotificationTone;
  createdAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class InAppNotifications {
  private readonly notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  readonly notifications$ = this.notificationsSubject.asObservable();

  show(title: string, message: string, tone: NotificationTone = 'info', durationMs = 5000): void {
    const notification: AppNotification = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      message,
      tone,
      createdAt: Date.now(),
    };

    this.notificationsSubject.next([notification, ...this.notificationsSubject.value].slice(0, 5));

    if (typeof window !== 'undefined') {
      window.setTimeout(() => this.dismiss(notification.id), durationMs);
    }
  }

  dismiss(id: string): void {
    this.notificationsSubject.next(
      this.notificationsSubject.value.filter(notification => notification.id !== id)
    );
  }
}
