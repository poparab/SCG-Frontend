import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { TRANSLATE_HTTP_LOADER_CONFIG, TranslateHttpLoader } from '@ngx-translate/http-loader';
import { authInterceptor, correlationIdInterceptor } from './core/interceptors/http.interceptors';

import { routes } from './app.routes';

const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem('scg_lang') || 'ar' : 'ar';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, correlationIdInterceptor])),
    {
      provide: TRANSLATE_HTTP_LOADER_CONFIG,
      useValue: {
        prefix: '/assets/i18n/',
        suffix: '.json'
      }
    },
    provideTranslateService({
      lang: savedLang,
      fallbackLang: 'ar',
      loader: provideTranslateLoader(TranslateHttpLoader)
    })
  ]
};
