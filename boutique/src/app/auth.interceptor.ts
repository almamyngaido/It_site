import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

const CSRF_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Reads a cookie value by name from document.cookie.
 */
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Always send cookies (required for HttpOnly auth cookies)
    let req = request.clone({ withCredentials: true });

    // Attach CSRF token for state-mutating requests
    if (CSRF_METHODS.includes(req.method)) {
      const csrfToken = getCookie('csrf_token');
      if (csrfToken) {
        req = req.clone({
          setHeaders: { 'X-CSRF-Token': csrfToken }
        });
      } else {
        console.debug('[AuthInterceptor] No csrf_token cookie found for', req.method, req.url);
      }
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 0) {
          console.error('[AuthInterceptor] ERR_CONNECTION_REFUSED — backend not reachable at:', req.url);
          console.error('[AuthInterceptor] Make sure the API server is running (npm start in it-api)');
        } else if (error.status === 401) {
          console.warn('[AuthInterceptor] 401 Unauthorized on', req.url, '— session may have expired');
        } else if (error.status === 403) {
          console.warn('[AuthInterceptor] 403 Forbidden on', req.url, '— CSRF token mismatch or insufficient role');
        }
        return throwError(() => error);
      })
    );
  }
}
