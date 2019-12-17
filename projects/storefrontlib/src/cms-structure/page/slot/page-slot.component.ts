import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  Renderer2,
} from '@angular/core';
import {
  CmsConfig,
  CmsService,
  ContentSlotComponentData,
  ContentSlotData,
  DeferLoadingStrategy,
  DynamicAttributeService,
} from '@spartacus/core';
import { IntersectionOptions } from 'projects/storefrontlib/src/layout';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'cx-page-slot',
  templateUrl: './page-slot.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageSlotComponent {
  slotPosition: string;

  @Input() set position(position: string) {
    this.slotPosition = position;
    this.position$.next(position);
    // add the position name as a css class so that
    // layout can be applied to it, using the position based class.
    this.renderer.addClass(this.hostElement.nativeElement, position);
  }

  readonly position$ = new BehaviorSubject<string>(undefined);

  /**
   * observable with `ContentSlotData` for the current position
   */
  readonly slot$: Observable<ContentSlotData> = this.position$.pipe(
    switchMap(position => this.cmsService.getContentSlot(position)),
    tap(slot => this.addSmartEditSlotClass(slot))
  );

  /**
   * observable with components (`ContentSlotComponentData[]`)
   * for the current slot
   */
  readonly components$: Observable<
    ContentSlotComponentData[]
  > = this.slot$.pipe(
    map(slot => (slot && slot.components ? slot.components : [])),
    distinctUntilChanged(
      (a, b) =>
        a.length === b.length && !a.find((el, index) => el.uid !== b[index].uid)
    ),
    tap(components => this.addComponentClass(components))
  );

  constructor(
    cmsService: CmsService,
    dynamicAttributeService: DynamicAttributeService,
    renderer: Renderer2,
    hostElement: ElementRef,
    // tslint:disable-next-line:unified-signatures
    config?: CmsConfig
  );

  /**
   * @deprecated since version 1.4
   * Use constructor(cmsService: CmsService, dynamicAttributeService: DynamicAttributeService, renderer: Renderer2, hostElement: ElementRef, config?: CmsConfig) instead
   */
  constructor(
    cmsService: CmsService,
    dynamicAttributeService: DynamicAttributeService,
    renderer: Renderer2,
    hostElement: ElementRef
  );
  constructor(
    protected cmsService: CmsService,
    protected dynamicAttributeService: DynamicAttributeService,
    protected renderer: Renderer2,
    protected hostElement: ElementRef,
    protected config?: CmsConfig
  ) {}

  getComponentDeferOptions(componentType: string): IntersectionOptions {
    const deferLoading = this.getDeferLoadingStrategy(componentType);
    return { deferLoading };
  }

  /**
   * The `DeferLoadingStrategy` indicates whether component rendering
   * should be deferred.
   */
  private getDeferLoadingStrategy(componentType: string): DeferLoadingStrategy {
    if (this.config) {
      return ((this.config as CmsConfig).cmsComponents[componentType] || {})
        .deferLoading;
    }
  }

  // add a class to indicate whether the class is empty or not
  private addComponentClass(components): void {
    if (components && components.length > 0) {
      this.renderer.addClass(this.hostElement.nativeElement, 'has-components');
    }
  }

  private addSmartEditSlotClass(slot): void {
    if (slot && this.cmsService.isLaunchInSmartEdit()) {
      this.addSmartEditContract(slot);
    }
  }

  private addSmartEditContract(slot: ContentSlotData): void {
    this.dynamicAttributeService.addDynamicAttributes(
      slot.properties,
      this.hostElement.nativeElement,
      this.renderer
    );
  }
}
