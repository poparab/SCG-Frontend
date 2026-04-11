import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let translateService: jasmine.SpyObj<TranslateService>;

  beforeEach(async () => {
    translateService = jasmine.createSpyObj<TranslateService>('TranslateService', ['use']);
    localStorage.removeItem('scg_lang');

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: TranslateService, useValue: translateService }],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.removeItem('scg_lang');
    document.documentElement.lang = '';
    document.documentElement.dir = '';
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'SCG-Frontend' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('SCG-Frontend');
  });

  it('should initialize Arabic language defaults', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(translateService.use).toHaveBeenCalledWith('ar');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });
});
