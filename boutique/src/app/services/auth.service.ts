import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { LoginCredentials, AuthResponse, User } from '../models/cart.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/users`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  /**
   * Load user from localStorage on service init.
   * Token is no longer stored — it lives in an HttpOnly cookie.
   */
  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
        console.debug('[AuthService] Restored session from localStorage:', user.email);
      } catch (e) {
        console.error('[AuthService] Failed to parse stored user, clearing session:', e);
        this.clearLocalState();
      }
    }
  }

  /**
   * Login — token is set as HttpOnly cookie by the server.
   * Response only contains { user }.
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    console.debug('[AuthService] Attempting login for:', credentials.email);
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials, { withCredentials: true })
      .pipe(
        tap(response => {
          console.debug('[AuthService] Login success:', response.user.email);
          localStorage.setItem('current_user', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }),
        catchError(err => this.handleError('login', err))
      );
  }

  /**
   * Register — token is set as HttpOnly cookie by the server.
   */
  register(user: User): Observable<AuthResponse> {
    console.debug('[AuthService] Attempting register for:', user.email);
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, user, { withCredentials: true })
      .pipe(
        catchError(err => this.handleError('register', err))
      );
  }

  /**
   * Logout — calls backend to clear HttpOnly cookies and revoke refresh token.
   */
  logout(): void {
    console.debug('[AuthService] Logging out');
    this.http
      .post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .subscribe({
        error: err => console.error('[AuthService] Logout request failed (cookies may not be cleared):', err)
      });
    this.clearLocalState();
  }

  /**
   * Refresh access token silently.
   */
  refresh(): Observable<{success: boolean}> {
    return this.http
      .post<{success: boolean}>(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        tap(() => console.debug('[AuthService] Token refreshed')),
        catchError(err => this.handleError('refresh', err))
      );
  }

  /** Get current user snapshot */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Session is alive if we have a user object in memory.
   * The actual auth is validated server-side via the HttpOnly cookie.
   */
  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  /** Get user profile from API */
  getUserProfile(userId: string): Observable<User> {
    return this.http
      .get<User>(`${this.apiUrl}/${userId}`, { withCredentials: true })
      .pipe(catchError(err => this.handleError('getUserProfile', err)));
  }

  /** Update user profile */
  updateProfile(userId: string, user: Partial<User>): Observable<User> {
    return this.http
      .patch<User>(`${this.apiUrl}/${userId}`, user, { withCredentials: true })
      .pipe(
        tap(updatedUser => {
          localStorage.setItem('current_user', JSON.stringify(updatedUser));
          this.currentUserSubject.next(updatedUser);
        }),
        catchError(err => this.handleError('updateProfile', err))
      );
  }

  // ─── Private helpers ───────────────────────────────────────────

  private clearLocalState(): void {
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
  }

  private handleError(context: string, error: any): Observable<never> {
    const status = error.status ?? 'network';

    if (status === 0) {
      // ERR_CONNECTION_REFUSED or network offline
      console.error(`[AuthService:${context}] Cannot reach server — is the API running on ${environment.apiUrl}?`, error);
    } else {
      console.error(`[AuthService:${context}] HTTP ${status}:`, error.error ?? error.message);
    }

    let errorMessage = 'Une erreur est survenue';
    if (error.status === 0) {
      errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
    } else if (error.status === 401) {
      errorMessage = 'Email ou mot de passe incorrect.';
    } else if (error.status === 400) {
      errorMessage = error.error?.error?.message ?? 'Requête invalide.';
    } else if (error.status === 429) {
      errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard.';
    } else if (error.error?.error?.message) {
      errorMessage = error.error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
