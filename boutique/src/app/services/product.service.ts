import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Product, ProductFilter } from '../models/product.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * Get all products
   */
  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl).pipe(
      tap(products => this.productsSubject.next(products)),
      catchError(this.handleError)
    );
  }

  /**
   * Get products with filter
   */
  getProducts(filter?: ProductFilter): Observable<Product[]> {
    console.log('[ProductService] getProducts called with filter:', filter);
    console.log('[ProductService] API URL:', this.apiUrl);

    let params = new HttpParams();

    if (filter) {
      if (filter.categoryId) {
        params = params.set('filter', JSON.stringify({
          where: { categoryId: filter.categoryId, isActive: true },
          include: ['category']
        }));
      }
      if (filter.isFeatured !== undefined) {
        params = params.set('filter', JSON.stringify({
          where: { isFeatured: filter.isFeatured, isActive: true },
          include: ['category']
        }));
      }
      if (filter.isActive !== undefined) {
        params = params.set('filter', JSON.stringify({
          where: { isActive: filter.isActive },
          include: ['category']
        }));
      }
    } else {
      // Default: get all active products with category
      const filterObj = {
        where: { isActive: true },
        include: ['category']
      };
      console.log('[ProductService] Using default filter:', filterObj);
      params = params.set('filter', JSON.stringify(filterObj));
    }

    const fullUrl = `${this.apiUrl}?${params.toString()}`;
    console.log('[ProductService] Full request URL:', fullUrl);

    return this.http.get<Product[]>(this.apiUrl, { params }).pipe(
      tap(products => {
        console.log('[ProductService] Success! Received products:', products);
        this.productsSubject.next(products);
      }),
      catchError(error => {
        console.error('[ProductService] Error details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          error: error.error
        });
        return this.handleError(error);
      })
    );
  }

  /**
   * Get featured products
   */
  getFeaturedProducts(): Observable<Product[]> {
    const params = new HttpParams().set('filter', JSON.stringify({
      where: { isFeatured: true, isActive: true },
      include: ['category']
    }));

    return this.http.get<Product[]>(this.apiUrl, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get product by ID
   */
  getProductById(id: string): Observable<Product> {
    const params = new HttpParams().set('filter', JSON.stringify({
      include: ['category']
    }));

    return this.http.get<Product>(`${this.apiUrl}/${id}`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Search products by name or description
   */
  searchProducts(query: string): Observable<Product[]> {
    const params = new HttpParams().set('filter', JSON.stringify({
      where: {
        or: [
          { name: { like: `.*${query}.*`, options: 'i' } },
          { description: { like: `.*${query}.*`, options: 'i' } }
        ],
        isActive: true
      },
      include: ['category']
    }));

    return this.http.get<Product[]>(this.apiUrl, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get products by category
   */
  getProductsByCategory(categoryId: string): Observable<Product[]> {
    const params = new HttpParams().set('filter', JSON.stringify({
      where: { categoryId: categoryId, isActive: true },
      include: ['category']
    }));

    return this.http.get<Product[]>(this.apiUrl, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get product count
   */
  getProductCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/count`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Create a new product (admin only)
   */
  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product).pipe(
      tap(() => this.refreshProducts()),
      catchError(this.handleError)
    );
  }

  /**
   * Update a product (admin only)
   */
  updateProduct(id: string, product: Partial<Product>): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}`, product).pipe(
      tap(() => this.refreshProducts()),
      catchError(this.handleError)
    );
  }

  /**
   * Delete a product (admin only)
   */
  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.refreshProducts()),
      catchError(this.handleError)
    );
  }

  /**
   * Refresh products list
   */
  private refreshProducts(): void {
    this.getAllProducts().subscribe();
  }

  /**
   * Error handling
   */
  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(() => new Error(error.message || 'Server error'));
  }

  /**
   * Check if product is in stock
   */
  isInStock(product: Product): boolean {
    return product.stockQuantity > 0;
  }

  /**
   * Get discount percentage
   */
  getDiscountPercentage(product: Product): number | null {
    if (product.compareAtPrice && product.compareAtPrice > product.price) {
      return Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
    }
    return null;
  }
}
