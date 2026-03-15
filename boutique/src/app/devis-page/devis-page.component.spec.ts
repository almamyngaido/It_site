import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevisPageComponent } from './devis-page.component';

describe('DevisPageComponent', () => {
  let component: DevisPageComponent;
  let fixture: ComponentFixture<DevisPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DevisPageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DevisPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
