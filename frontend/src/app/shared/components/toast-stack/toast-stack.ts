import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { InAppNotifications } from '../../../core/services/in-app-notifications';

@Component({
  selector: 'app-toast-stack',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-stack.html',
  styleUrl: './toast-stack.scss',
})
export class ToastStack {
  constructor(public notifications: InAppNotifications) {}

  trackById(_: number, notification: { id: string }): string {
    return notification.id;
  }
}
