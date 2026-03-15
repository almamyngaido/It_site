import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Category } from '../models/product.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Category[]> {
    const params = new HttpParams().set('filter', JSON.stringify({ where: {} }));
    return this.http.get<Category[]>(this.apiUrl, { params }).pipe(catchError(this.handleError));
  }

  getById(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
  }

  create(category: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, category).pipe(catchError(this.handleError));
  }

  update(id: string, category: Partial<Category>): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}`, category).pipe(catchError(this.handleError));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    console.error('[CategoryService]', error);
    return throwError(() => new Error(error.error?.error?.message ?? error.message ?? 'Server error'));
  }
}
