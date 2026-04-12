import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  private translate = inject(TranslateService);
  private router = inject(Router);
  private readonly authService = inject(AuthService);

  currentLang = localStorage.getItem('scg_lang') || this.translate.currentLang || 'ar';
  userName = '';
  userRole = '';

  ngOnInit(): void {
    this.translate.use(this.currentLang);
    document.documentElement.lang = this.currentLang;
    document.documentElement.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

    const user = this.authService.getUser();
    if (user) {
      this.userName = user.agencyName || user.email;
      this.userRole = user.role;
    }
  }

  switchLang(lang: string): void {
    this.translate.use(lang);
    this.currentLang = lang;
    localStorage.setItem('scg_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  logout(): void {
    this.authService.logout().subscribe({
      complete: () => {
        this.router.navigate(['/login'], { replaceUrl: true });
      }
    });
  }
}
