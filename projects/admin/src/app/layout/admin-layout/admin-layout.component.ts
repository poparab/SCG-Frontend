import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit {
  private translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  sidebarCollapsed = false;
  currentLang = localStorage.getItem('scg_lang') || this.translate.currentLang || 'ar';
  userName = '';
  userRole = '';

  ngOnInit(): void {
    this.translate.use(this.currentLang);
    document.documentElement.lang = this.currentLang;
    document.documentElement.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

    const user = this.authService.getUser();
    this.userName = user?.email ?? '';
    this.userRole = user?.role ?? '';
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  switchLang(lang: string): void {
    this.translate.use(lang);
    this.currentLang = lang;
    localStorage.setItem('scg_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  logout(): void {
    this.authService.logout().subscribe({
      complete: () => {
        this.router.navigate(['/auth/login'], { replaceUrl: true });
      }
    });
  }
}
