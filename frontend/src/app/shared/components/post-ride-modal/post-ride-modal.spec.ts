import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostRideModal } from './post-ride-modal';

describe('PostRideModal', () => {
  let component: PostRideModal;
  let fixture: ComponentFixture<PostRideModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostRideModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostRideModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
