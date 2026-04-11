import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const user = auth.getUser();
    if (!user || !allowedRoles.includes(user.role)) {
      router.navigate(['/login']);
      return false;
    }
    return true;
  };
}
