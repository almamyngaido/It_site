import { TestBed } from '@angular/core/testing';

import { PaydunyaService } from './paydunya.service';

describe('PaydunyaService', () => {
  let service: PaydunyaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaydunyaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
