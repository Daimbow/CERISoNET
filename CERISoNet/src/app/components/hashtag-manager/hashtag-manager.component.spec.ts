import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HashtagManagerComponent } from './hashtag-manager.component';

describe('HashtagManagerComponent', () => {
  let component: HashtagManagerComponent;
  let fixture: ComponentFixture<HashtagManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HashtagManagerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HashtagManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
