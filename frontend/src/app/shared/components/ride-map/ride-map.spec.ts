import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RideMap } from './ride-map';

describe('RideMap', () => {
  let component: RideMap;
  let fixture: ComponentFixture<RideMap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RideMap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RideMap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
