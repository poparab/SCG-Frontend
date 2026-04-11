import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { authInterceptor, correlationIdInterceptor } from './core/interceptors/http.interceptors';

import { routes } from './app.routes';

const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem('scg_lang') || 'ar' : 'ar';

export function createTranslateLoader(http: HttpClient): TranslateLoader {
  return {
    getTranslation(lang: string) {
      return http.get<Record<string, unknown>>(`./assets/i18n/${lang}.json`);
    }
  } as TranslateLoader;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, correlationIdInterceptor])),
    provideTranslateService({
      lang: savedLang,
      fallbackLang: 'ar',
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    })
  ]
};
