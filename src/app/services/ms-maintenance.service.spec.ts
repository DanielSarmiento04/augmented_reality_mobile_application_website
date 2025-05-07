import { TestBed } from '@angular/core/testing';

import { MsMaintenanceService } from './ms-maintenance.service';

describe('MsMaintenanceService', () => {
  let service: MsMaintenanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MsMaintenanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
