import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-email-verify',
  templateUrl: './email-verify.component.html',
  styleUrls: ['./email-verify.component.css']
})
export class EmailVerifyComponent implements OnInit, OnDestroy {
  isLoading: boolean = true;
  isSuccess: boolean = false;
  error: string | null = null;
  token: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Get token from query params
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        console.log('🔍 Email Verify - URL Params:', params);
        this.token = params['token'];

        if (this.token) {
          console.log('✅ Token found:', this.token);
          this.verifyEmail(this.token);
        } else {
          console.error('❌ No token found in URL');
          this.error = 'Token de vérification manquant';
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Verify email with token
   */
  verifyEmail(token: string): void {
    console.log('📡 Verifying email with token:', token);

    const verificationUrl = `${environment.apiUrl}/auth/verify-email?token=${encodeURIComponent(token)}`;

    this.http.get<{ message: string }>(verificationUrl)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Email verification successful:', response);
          this.isSuccess = true;
          this.isLoading = false;
          this.error = null;

          // Redirect to login after 3 seconds
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (err) => {
          console.error('❌ Email verification failed:', err);
          this.isSuccess = false;
          this.isLoading = false;

          if (err.status === 400) {
            this.error = 'Token invalide ou expiré. Veuillez demander un nouveau lien de vérification.';
          } else if (err.status === 404) {
            this.error = 'Utilisateur non trouvé.';
          } else {
            this.error = err.error?.message || 'Erreur lors de la vérification de l\'email. Veuillez réessayer.';
          }
        }
      });
  }

  /**
   * Go to login page
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Go to home page
   */
  goHome(): void {
    this.router.navigate(['/']);
  }
}
