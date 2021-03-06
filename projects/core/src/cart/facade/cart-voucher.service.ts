import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../../auth/index';
import * as fromProcessStore from '../../process/store/process-state';
import {
  getProcessErrorFactory,
  getProcessLoadingFactory,
  getProcessSuccessFactory,
} from '../../process/store/selectors/process.selectors';
import { CartActions } from '../store/actions/index';
import { ADD_VOUCHER_PROCESS_ID } from '../store/multi-cart-state';
import { ActiveCartService } from './active-cart.service';

@Injectable()
export class CartVoucherService {
  constructor(
    protected store: Store<fromProcessStore.StateWithProcess<void>>,
    protected authService: AuthService,
    protected activeCartService: ActiveCartService
  ) {}

  addVoucher(voucherId: string, cartId?: string): void {
    this.combineUserAndCartId(cartId).subscribe(([occUserId, cartIdentifier]) =>
      this.store.dispatch(
        new CartActions.CartAddVoucher({
          userId: occUserId,
          cartId: cartIdentifier,
          voucherId: voucherId,
        })
      )
    );
  }

  removeVoucher(voucherId: string, cartId?: string): void {
    this.combineUserAndCartId(cartId).subscribe(([occUserId, cartIdentifier]) =>
      this.store.dispatch(
        new CartActions.CartRemoveVoucher({
          userId: occUserId,
          cartId: cartIdentifier,
          voucherId: voucherId,
        })
      )
    );
  }

  getAddVoucherResultError(): Observable<boolean> {
    return this.store.pipe(
      select(getProcessErrorFactory(ADD_VOUCHER_PROCESS_ID))
    );
  }

  getAddVoucherResultSuccess(): Observable<boolean> {
    return this.store.pipe(
      select(getProcessSuccessFactory(ADD_VOUCHER_PROCESS_ID))
    );
  }

  getAddVoucherResultLoading(): Observable<boolean> {
    return this.store.pipe(
      select(getProcessLoadingFactory(ADD_VOUCHER_PROCESS_ID))
    );
  }

  resetAddVoucherProcessingState(): void {
    this.store.dispatch(new CartActions.CartResetAddVoucher());
  }

  private combineUserAndCartId(cartId: string): Observable<[string, string]> {
    if (cartId) {
      return this.authService.getOccUserId().pipe(
        take(1),
        map((userId) => [userId, cartId])
      );
    } else {
      return combineLatest([
        this.authService.getOccUserId(),
        this.activeCartService.getActiveCartId(),
      ]).pipe(take(1));
    }
  }
}
