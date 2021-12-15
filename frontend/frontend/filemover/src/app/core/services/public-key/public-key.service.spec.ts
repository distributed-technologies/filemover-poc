import { TestBed } from '@angular/core/testing';

import { PublicKeyService } from './public-key.service';

describe('PublicKeyService', () => {
  let service: PublicKeyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PublicKeyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
