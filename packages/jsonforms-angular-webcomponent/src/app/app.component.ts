import { OverlayContainer } from '@angular/cdk/overlay';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Injector,
  Input,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { JsonFormsModule } from '@jsonforms/angular';
import {
  angularMaterialRenderers,
  JsonFormsAngularMaterialModule,
} from '@jsonforms/angular-material';
import { ShadowDomOverlayContainer } from './shadow-dom-overlay-container';

@Component({
  selector: 'ng-jsonforms',
  standalone: true,
  imports: [JsonFormsModule, JsonFormsAngularMaterialModule],
  templateUrl: './app.component.html',
  styleUrls: ['./material-theme.scss', './app.component.css'],
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {
  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private injector: Injector
  ) {}

  // Store raw inputs to track changes
  private _schema: string | object = {};
  private _uischema: string | object | undefined;
  private _data: string | object = {};
  private _readonly: boolean = false;
  private _dark: boolean = false;

  internalSchema: any = {};
  internalUischema: any;
  internalData: any = {};
  readonly renderers = angularMaterialRenderers;

  @Input()
  set schema(value: string | object) {
    this._schema = value;
    this.internalSchema = typeof value === 'string' ? JSON.parse(value) : value;
  }
  get schema() {
    return this._schema;
  }

  @Input()
  set uischema(value: string | object | undefined) {
    this._uischema = value;
    this.internalUischema = value
      ? typeof value === 'string'
        ? JSON.parse(value)
        : value
      : undefined;
  }
  get uischema() {
    return this._uischema;
  }

  @Input()
  set data(value: string | object) {
    this._data = value;
    this.internalData = typeof value === 'string' ? JSON.parse(value) : value;
  }
  get data() {
    return this._data;
  }

  @Input()
  set readonly(value: boolean) {
    this._readonly = value;
  }
  get readonly() {
    return this._readonly;
  }

  @Input()
  set dark(value: boolean | string) {
    // Handle both boolean and string "true"/"false" from HTML attributes
    this._dark = value === true || value === 'true';
  }
  get dark() {
    return this._dark;
  }

  @Output() dataChange = new EventEmitter<any>();
  @Output() errors = new EventEmitter<any>();

  @HostBinding('class.dark-mode')
  get isDarkMode() {
    return this._dark;
  }

  onDataChange(data: any): void {
    this.internalData = data;
    this.dataChange.emit(data);
  }

  onErrors(errors: any): void {
    this.errors.emit(errors);
  }

  ngAfterViewInit() {
    const shadow = this.elementRef.nativeElement.shadowRoot!;

    const overlay = this.injector.get(
      OverlayContainer
    ) as ShadowDomOverlayContainer;
    overlay.setContainerElement(shadow);
  }
}
