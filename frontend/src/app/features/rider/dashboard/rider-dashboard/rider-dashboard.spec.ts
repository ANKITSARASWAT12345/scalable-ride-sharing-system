import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiderDashboard } from './rider-dashboard';

describe('RiderDashboard', () => {
  let component: RiderDashboard;
  let fixture: ComponentFixture<RiderDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RiderDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RiderDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
