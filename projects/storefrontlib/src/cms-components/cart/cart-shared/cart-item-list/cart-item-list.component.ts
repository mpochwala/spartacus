import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  ActiveCartService,
  ConsignmentEntry,
  FeatureConfigService,
  PromotionLocation,
  SelectiveCartService,
} from '@spartacus/core';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import {
  CartItemComponentOptions,
  Item,
} from '../cart-item/cart-item.component';

@Component({
  selector: 'cx-cart-item-list',
  templateUrl: './cart-item-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartItemListComponent {
  @Input() readonly = false;

  @Input() hasHeader = true;

  @Input() options: CartItemComponentOptions = {
    isSaveForLater: false,
    optionalBtn: null,
  };

  private _items: Item[] = [];
  form: FormGroup;

  @Input('items')
  // TODO: currently we're getting a new array of items if the cart changes.
  // pretty annoying as it forces a repaint on the screen,
  // which is noticable in the UI.
  set items(items: Item[]) {
    this.resolveItems(items);
    this.createForm();
  }
  get items(): Item[] {
    return this._items;
  }

  @Input() promotionLocation: PromotionLocation = PromotionLocation.ActiveCart;

  @Input('cartIsLoading') set setLoading(value: boolean) {
    if (!this.readonly) {
      // Whenver the cart is loading, we disable the complete form
      // to avoid any user interaction with the cart.
      value
        ? this.form.disable({ emitEvent: false })
        : this.form.enable({ emitEvent: false });
    }
  }

  constructor(
    protected activeCartService: ActiveCartService,
    protected selectiveCartService: SelectiveCartService,
    protected featureConfig: FeatureConfigService
  ) {}

  //TODO remove feature flag for #5958
  isSaveForLaterEnabled(): boolean {
    if (this.featureConfig) {
      return this.featureConfig.isEnabled('saveForLater');
    }
    return false;
  }
  //TODO remove feature flag for #5958

  /**
   * The items we're getting form the input do not have a consistent model.
   * In case of a `consignmentEntry`, we need to normalize the data from the orderEntry.
   */
  private resolveItems(items: Item[]): void {
    if (items.every((item) => item.hasOwnProperty('orderEntry'))) {
      this._items = items.map((consignmentEntry) => {
        const entry = Object.assign(
          {},
          (consignmentEntry as ConsignmentEntry).orderEntry
        );
        entry.quantity = consignmentEntry.quantity;
        return entry;
      });
    } else {
      this._items = items;
    }
  }

  private createForm(): void {
    this.form = new FormGroup({});
    this._items.forEach((item) => {
      const { code } = item.product;
      const group = new FormGroup({
        entryNumber: new FormControl((<any>item).entryNumber),
        quantity: new FormControl(item.quantity, { updateOn: 'blur' }),
      });
      if (!item.updateable || this.readonly) {
        group.disable();
      }
      this.form.addControl(code, group);
    });
  }

  removeEntry(item: Item): void {
    if (this.selectiveCartService && this.options.isSaveForLater) {
      this.selectiveCartService.removeEntry(item);
    } else {
      this.activeCartService.removeEntry(item);
    }
    delete this.form.controls[item.product.code];
  }

  getControl(item: Item): Observable<FormGroup> {
    return this.form.get(item.product.code).valueChanges.pipe(
      // tslint:disable-next-line:deprecation
      startWith(null),
      map((value) => {
        if (value && this.selectiveCartService && this.options.isSaveForLater) {
          this.selectiveCartService.updateEntry(
            value.entryNumber,
            value.quantity
          );
        } else if (value) {
          this.activeCartService.updateEntry(value.entryNumber, value.quantity);
        }
      }),
      map(() => <FormGroup>this.form.get(item.product.code))
    );
  }
}
