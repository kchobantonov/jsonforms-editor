import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { OverlayContainer } from '@angular/cdk/overlay';
import { ShadowDomOverlayContainer } from './shadow-dom-overlay-container';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: OverlayContainer, useClass: ShadowDomOverlayContainer },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    // 💡 CRITICAL STEP: Trigger change detection.
    // This executes ngOnInit() on all components in the fixture,
    // initializing the subscription in JsonFormsComponent.
    fixture.detectChanges();

    expect(app).toBeTruthy();
  });

  // it(`should have the 'jsonforms-angular-webcomponent' title`, () => {
  //   const fixture = TestBed.createComponent(AppComponent);
  //   const app = fixture.componentInstance;
  //   expect(app.title).toEqual('jsonforms-angular-webcomponent');
  // });

  // it('should render title', () => {
  //   const fixture = TestBed.createComponent(AppComponent);
  //   fixture.detectChanges();
  //   const compiled = fixture.nativeElement as HTMLElement;
  //   expect(compiled.querySelector('h1')?.textContent).toContain('Hello, jsonforms-angular-webcomponent');
  // });
});
