import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicesItComponent } from './services-it.component';

describe('ServicesItComponent', () => {
  let component: ServicesItComponent;
  let fixture: ComponentFixture<ServicesItComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServicesItComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServicesItComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
