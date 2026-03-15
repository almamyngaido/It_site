import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { LoginCredentials, User } from '../models/cart.model';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent implements OnInit, OnDestroy {
  isRegistering: boolean = false;
  isLoading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Login Form
  loginForm: LoginCredentials = {
    email: '',
    password: ''
  };

  // Register Form
  registerForm: User = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: ''
  };

  private destroy$ = new Subject<void>();
  private redirectUrl: string = '/';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check if user is already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }

    // Get redirect URL from query params
    this.route.queryParams.subscribe(params => {
      this.redirectUrl = params['redirect'] || '/';
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggle between login and register
   */
  toggleAuthMode(): void {
    this.isRegistering = !this.isRegistering;
    this.error = null;
    this.successMessage = null;
  }

  /**
   * Login
   */
  login(): void {
    if (!this.validateLoginForm()) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.authService.login(this.loginForm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = 'Connexion réussie! Redirection...';

          setTimeout(() => {
            this.router.navigate([this.redirectUrl]);
          }, 1000);
        },
        error: (err) => {
          this.isLoading = false;
          this.error = err.message || 'Erreur de connexion. Veuillez vérifier vos identifiants.';
        }
      });
  }

  /**
   * Register
   */
  register(): void {
    if (!this.validateRegisterForm()) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    // Add default role and isActive for new users
    const registrationData: User = {
      ...this.registerForm,
      role: 'customer',
      isActive: false
    };

    this.authService.register(registrationData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = 'Inscription réussie! Un email de vérification a été envoyé à votre adresse. Veuillez vérifier votre email avant de vous connecter.';

          // Clear the registration form
          this.registerForm = {
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            phone: ''
          };

          // Switch to login form after 5 seconds
          setTimeout(() => {
            this.isRegistering = false;
            this.successMessage = 'Veuillez vérifier votre email et vous connecter.';

            // Clear the success message after another 3 seconds
            setTimeout(() => {
              this.successMessage = null;
            }, 3000);
          }, 5000);
        },
        error: (err) => {
          this.isLoading = false;
          this.error = err.message || 'Erreur lors de l\'inscription. Veuillez réessayer.';
        }
      });
  }

  /**
   * Validate login form
   */
  private validateLoginForm(): boolean {
    if (!this.loginForm.email || !this.loginForm.password) {
      this.error = 'Veuillez remplir tous les champs.';
      return false;
    }

    if (!this.isValidEmail(this.loginForm.email)) {
      this.error = 'Veuillez entrer une adresse email valide.';
      return false;
    }

    if (this.loginForm.password.length < 6) {
      this.error = 'Le mot de passe doit contenir au moins 6 caractères.';
      return false;
    }

    return true;
  }

  /**
   * Validate register form
   */
  private validateRegisterForm(): boolean {
    if (!this.registerForm.email || !this.registerForm.password ||
        !this.registerForm.firstName || !this.registerForm.lastName) {
      this.error = 'Veuillez remplir tous les champs obligatoires.';
      return false;
    }

    if (!this.isValidEmail(this.registerForm.email)) {
      this.error = 'Veuillez entrer une adresse email valide.';
      return false;
    }

    if (this.registerForm.password.length < 6) {
      this.error = 'Le mot de passe doit contenir au moins 6 caractères.';
      return false;
    }

    return true;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
