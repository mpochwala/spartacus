import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BaseSiteService, WindowRef } from '@spartacus/core';
import { fromEvent, merge, Observable } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';
import { CdsConfig } from '../../config/index';
import {
  ConsentReferenceEvent,
  DebugEvent,
  ProfileTagEventNames,
  ProfileTagJsConfig,
  ProfileTagWindowObject,
  PushEvent,
} from '../model/profile-tag.model';

@Injectable({
  providedIn: 'root',
})
export class ProfileTagEventService {
  latestConsentReference = null;
  profileTagDebug = false;
  private consentReference$: Observable<string>;
  private profileTagWindow: ProfileTagWindowObject;
  private profileTagEvents$ = merge(
    this.setConsentReference(),
    this.debugModeChanged()
  );
  constructor(
    private winRef: WindowRef,
    private config: CdsConfig,
    private baseSiteService: BaseSiteService,
    @Inject(PLATFORM_ID) private platform: any
  ) {}

  getProfileTagEvents(): Observable<string | DebugEvent | Event> {
    return this.profileTagEvents$;
  }
  getConsentReference(): Observable<string> {
    if (!this.consentReference$) {
      this.consentReference$ = fromEvent(
        this.winRef.nativeWindow,
        ProfileTagEventNames.CONSENT_REFERENCE_LOADED
      ).pipe(
        map(event => <ConsentReferenceEvent>event),
        map(event => event.detail.consentReference),
        shareReplay(1)
      );
    }
    return this.consentReference$;
  }

  addTracker(): Observable<Event> {
    return this.baseSiteService.getActive().pipe(
      filter(_ => isPlatformBrowser(this.platform)),
      filter((siteId: string) => Boolean(siteId)),
      distinctUntilChanged(),
      tap(_ => this.addScript()),
      tap(_ => this.initWindow()),
      tap((siteId: string) => this.createConfig(siteId)),
      switchMap(_ => this.profileTagLoaded())
    );
  }

  private setConsentReference(): Observable<string> {
    return this.getConsentReference().pipe(
      tap(consentReference => (this.latestConsentReference = consentReference))
    );
  }

  private profileTagLoaded(): Observable<Event> {
    return fromEvent(
      this.winRef.nativeWindow,
      ProfileTagEventNames.LOADED
    ).pipe(take(1));
  }

  private debugModeChanged(): Observable<DebugEvent> {
    return fromEvent(
      this.winRef.nativeWindow,
      ProfileTagEventNames.DEBUG_FLAG_CHANGED
    ).pipe(
      map(event => <DebugEvent>event),
      tap(event => (this.profileTagDebug = event.detail.debug))
    );
  }

  private createConfig(siteId: string): void {
    const newConfig: ProfileTagJsConfig = {
      ...this.config.cds.profileTag,
      tenant: this.config.cds.tenant,
      siteId,
      spa: true,
    };
    this.exposeConfig(newConfig);
  }

  private addScript(): void {
    const profileTagScript = this.winRef.document.createElement('script');
    profileTagScript.type = 'text/javascript';
    profileTagScript.async = true;
    profileTagScript.src = this.config.cds.profileTag.javascriptUrl;
    this.winRef.document
      .getElementsByTagName('head')[0]
      .appendChild(profileTagScript);
  }

  private initWindow(): void {
    this.profileTagWindow = <ProfileTagWindowObject>(
      (<unknown>this.winRef.nativeWindow)
    );
    this.profileTagWindow.Y_TRACKING = this.profileTagWindow.Y_TRACKING || {};
    this.profileTagWindow.Y_TRACKING.eventLayer =
      this.profileTagWindow.Y_TRACKING.eventLayer || [];
  }

  private exposeConfig(options: ProfileTagJsConfig): void {
    const q = this.profileTagWindow.Y_TRACKING.q || [];
    q.push([options]);
    this.profileTagWindow.Y_TRACKING.q = q;
  }

  notifyProfileTagOfEventOccurence(event: PushEvent): void {
    try {
      this.profileTagWindow.Y_TRACKING.eventLayer.push(event);
    } catch (e) {
      console.log(`Unexpected error when calling profiletag push method ${e}`);
    }
  }
}
