import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageWallComponent } from './message-wall.component';

describe('MessageWallComponent', () => {
  let component: MessageWallComponent;
  let fixture: ComponentFixture<MessageWallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageWallComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MessageWallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
