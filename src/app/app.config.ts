import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { routes } from './app.routes';
import { authInterceptor, correlationIdInterceptor } from './core/interceptors/http.interceptors';

const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem('scg_lang') || 'ar' : 'ar';

export function HttpLoaderFactory(http: HttpClient): TranslateLoader {
  fetch('/_debug_factory_called').catch(() => {});
  fetch(`/_debug_http_type_${typeof http}`).catch(() => {});
  fetch(`/_debug_http_get_type_${typeof http?.get}`).catch(() => {});
  return {
    getTranslation(lang: string) {
      fetch(`/_debug_get_translation_${lang}`).catch(() => {});
      try {
        const obs = http.get(`./assets/i18n/${lang}.json`);
        fetch(`/_debug_obs_type_${typeof obs}`).catch(() => {});
        fetch(`/_debug_obs_subscribe_type_${typeof obs?.subscribe}`).catch(() => {});
        // Force subscribe to check if request fires
        obs.subscribe({
          next: () => fetch('/_debug_http_next_ok').catch(() => {}),
          error: (e: any) => fetch(`/_debug_http_sub_err`).catch(() => {})
        });
        return obs;
      } catch (e: any) {
        fetch(`/_debug_get_error`).catch(() => {});
        throw e;
      }
    }
  } as TranslateLoader;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([correlationIdInterceptor, authInterceptor])
    ),
    importProvidersFrom(
      TranslateModule.forRoot({
        lang: savedLang,
        fallbackLang: 'ar',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    )
  ]
};
