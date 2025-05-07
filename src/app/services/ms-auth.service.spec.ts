import { TestBed } from '@angular/core/testing';

import { MsAuthService } from './ms-auth.service';

describe('MsAuthService', () => {
  let service: MsAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MsAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
