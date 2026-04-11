import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { routes } from './app.routes';
import { authInterceptor, correlationIdInterceptor } from './core/interceptors/http.interceptors';

const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem('scg_lang') || 'ar' : 'ar';

export function HttpLoaderFactory(http: HttpClient): TranslateLoader {
  fetch('/_debug_factory_called').catch(() => {});
  return {
    getTranslation(lang: string) {
      fetch(`/_debug_get_translation_${lang}`).catch(() => {});
      return http.get(`./assets/i18n/${lang}.json`);
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
