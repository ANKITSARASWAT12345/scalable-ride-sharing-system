import { TestBed } from '@angular/core/testing';

import { Rating } from './rating';

describe('Rating', () => {
  let service: Rating;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Rating);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
