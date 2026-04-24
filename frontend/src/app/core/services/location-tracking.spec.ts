import { TestBed } from '@angular/core/testing';

import { LocationTracking } from './location-tracking';

describe('LocationTracking', () => {
  let service: LocationTracking;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocationTracking);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
