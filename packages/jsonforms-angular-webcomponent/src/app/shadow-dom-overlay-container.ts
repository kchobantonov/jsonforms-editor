import { OverlayContainer } from '@angular/cdk/overlay';
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

@Injectable()
export class ShadowDomOverlayContainer extends OverlayContainer {
  constructor(@Inject(DOCUMENT) private doc: Document) {
    super(doc);
  }

  public setContainerElement(shadowRoot: ShadowRoot) {
    if (this._containerElement) {
      this._containerElement.remove();
    }
    const container = shadowRoot.appendChild(
      this._document.createElement('div')
    );
    container.classList.add('cdk-overlay-container');
    this._containerElement = container;
  }
}
