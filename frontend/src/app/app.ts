import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastStack } from './shared/components/toast-stack/toast-stack';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastStack],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');
}
