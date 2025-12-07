import { CUSTOM_ELEMENTS_SCHEMA, Injector, NgModule } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { OverlayContainer } from '@angular/cdk/overlay';
import { ShadowDomOverlayContainer } from './shadow-dom-overlay-container';

@NgModule({
  imports: [BrowserModule, BrowserAnimationsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    {
      provide: OverlayContainer,
      useClass: ShadowDomOverlayContainer,
    },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        appearance: 'outline',
        hideRequiredMarker: false,
        floatLabel: 'auto',
      },
    },
  ],
})
export class AppModule {
  constructor(private injector: Injector) {
    const element = createCustomElement(AppComponent, { injector });
    customElements.define('ng-jsonforms', element);
  }

  ngDoBootstrap() {}
}
