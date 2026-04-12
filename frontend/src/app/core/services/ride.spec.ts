import { TestBed } from '@angular/core/testing';

import { Ride } from './ride';

describe('Ride', () => {
  let service: Ride;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Ride);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
