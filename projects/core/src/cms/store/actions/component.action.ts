import { CmsComponent } from '../../../model/cms.model';
import { PageContext } from '../../../routing/index';
import { StateEntityLoaderActions } from '../../../state/utils/index';
import { COMPONENT_ENTITY } from '../cms-state';

export const LOAD_CMS_COMPONENT = '[Cms] Load Component';
export const LOAD_CMS_COMPONENT_FAIL = '[Cms] Load Component Fail';
export const LOAD_CMS_COMPONENT_SUCCESS = '[Cms] Load Component Success';
export const CMS_GET_COMPONENET_FROM_PAGE = '[Cms] Get Component from Page';

export class LoadCmsComponent extends StateEntityLoaderActions.EntityLoadAction {
  readonly type = LOAD_CMS_COMPONENT;
  // TODO:#4603 - after updating tests, make `pageContext` optional
  constructor(
    public payload: string,
    // TODO:#4603 - make public?
    public pageContext: PageContext
  ) {
    super(COMPONENT_ENTITY, payload);
  }
}

export class LoadCmsComponentFail extends StateEntityLoaderActions.EntityFailAction {
  readonly type = LOAD_CMS_COMPONENT_FAIL;
  // TODO:#4603 - after updating tests, make `pageContext` optional
  constructor(
    uid: string,
    public payload: any,
    // TODO:#4603 - make public?
    public pageContext: PageContext
  ) {
    super(COMPONENT_ENTITY, uid, payload);
  }
}

export class LoadCmsComponentSuccess<
  T extends CmsComponent
> extends StateEntityLoaderActions.EntitySuccessAction {
  readonly type = LOAD_CMS_COMPONENT_SUCCESS;
  constructor(
    public payload: T,
    uid?: string,
    // TODO:#4603 - make public?
    public pageContext?: PageContext
  ) {
    super(COMPONENT_ENTITY, uid || payload.uid || '');
  }
}

// TODO:#4603 - CmsGetComponentFromPage?
export class CmsGetComponentFromPage<
  T extends CmsComponent
> extends StateEntityLoaderActions.EntitySuccessAction {
  readonly type = CMS_GET_COMPONENET_FROM_PAGE;
  // TODO:#4603 - once all references have been updated, make `context` optional
  constructor(
    public payload: T[],
    // TODO:#4603 - make public?
    public pageContext: PageContext
  ) {
    super(COMPONENT_ENTITY, payload.map(cmp => cmp.uid));
  }
}

// action types
export type CmsComponentAction<T extends CmsComponent> =
  | LoadCmsComponent
  | LoadCmsComponentFail
  | LoadCmsComponentSuccess<T>
  | CmsGetComponentFromPage<T>;
