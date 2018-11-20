import { InjectionToken, Provider } from '@angular/core';

import { ActionReducer, ActionReducerMap, createFeatureSelector, MemoizedSelector, MetaReducer } from '@ngrx/store';

import * as fromUserTokenReducer from './user-token.reducer';
import * as fromClientTokenReducer from './client-token.reducer';
import { AuthState } from '../auth-state';

export function getReducers(): ActionReducerMap<AuthState> {
  return {
    userToken: fromUserTokenReducer.reducer,
    clientToken: fromClientTokenReducer.reducer
  };
}

export const reducerToken: InjectionToken<
  ActionReducerMap<AuthState>
> = new InjectionToken<ActionReducerMap<AuthState>>('AuthReducers');

export const reducerProvider: Provider = {
  provide: reducerToken,
  useFactory: getReducers
};

export const getAuthState: MemoizedSelector<
  any,
  AuthState
> = createFeatureSelector<AuthState>('auth');

export function clearAuthState(
  reducer: ActionReducer<any>
): ActionReducer<any> {
  return function(state, action) {
    if (action.type === '[Auth] Logout') {
      state = {
        ...state,
        userToken: undefined
      };
    }
    return reducer(state, action);
  };
}

export const metaReducers: MetaReducer<any>[] = [clearAuthState];
