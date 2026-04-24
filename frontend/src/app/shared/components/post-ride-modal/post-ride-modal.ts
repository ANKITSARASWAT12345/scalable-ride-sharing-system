import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RideResponse } from '../../../core/models/ride.model';
import { Rating } from '../../../core/services/rating';
import { InAppNotifications } from '../../../core/services/in-app-notifications';

@Component({
  selector: 'app-post-ride-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-ride-modal.html',
  styleUrl: './post-ride-modal.scss'
})
export class PostRideModal {

  @Input() ride!: RideResponse;
  @Output() closed = new EventEmitter<void>();

  selectedStars = 0;
  hoveredStar = 0;
  selectedTags: string[] = [];
  rated = false;
  isSubmitting = false;
  submitError = '';

  quickTags = [
    'Great driver!',
    'Very polite',
    'Safe driving',
    'On time',
    'Clean vehicle',
    'Knew the route'
  ];

  constructor(
    private ratingService: Rating,
    private notifications: InAppNotifications
  ) {}

  selectStar(star: number): void {
    this.selectedStars = star;
  }

  hoverStar(star: number): void {
    this.hoveredStar = star;
  }

  toggleTag(tag: string): void {
    const idx = this.selectedTags.indexOf(tag);
    idx >= 0 ? this.selectedTags.splice(idx, 1) : this.selectedTags.push(tag);
  }

  submitRating(): void {
    if (this.selectedStars === 0) return;

    this.isSubmitting = true;
    this.submitError = '';

    this.ratingService.submitRating({
      rideId: this.ride.id,
      stars: this.selectedStars,
      comment: this.selectedTags.join(', ')
    }).subscribe({
      next: () => {
        this.rated = true;
        this.isSubmitting = false;
        this.notifications.show(
          'Rating submitted',
          `Your feedback for ${this.ride.driverName ?? 'the driver'} has been saved.`,
          'success'
        );
      },
      error: (err) => {
        this.isSubmitting = false;
        this.submitError = err.error?.error || 'Could not submit your rating. Please try again.';
        this.notifications.show('Rating failed', this.submitError, 'error');
      }
    });
  }

  onClose(): void {
    this.closed.emit();
  }
}
