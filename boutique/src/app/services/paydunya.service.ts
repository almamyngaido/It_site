import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface PaydunyaTransaction {
  id?: string;
  userId?: string;
  orderId?: string;
  paydunyaToken: string;
  paydunyaTransactionId?: string;
  transactionType?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency?: string;
  description?: string;
  checkoutUrl?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paydunyaResponse?: any;
  failureReason?: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInvoiceRequest {
  orderId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface CreateInvoiceResponse {
  transaction: PaydunyaTransaction;
  checkoutUrl: string;
}

export interface TransactionStatusResponse {
  transaction: PaydunyaTransaction;
  paydunyaStatus?: any;
}

@Injectable({
  providedIn: 'root'
})
export class PaydunyaService {
  private apiUrl = `${environment.apiUrl}/paydunya`;

  constructor(private http: HttpClient) {}

  /**
   * Create PayDunya invoice for an order
   */
  createInvoice(request: CreateInvoiceRequest): Observable<CreateInvoiceResponse> {
    return this.http.post<CreateInvoiceResponse>(`${this.apiUrl}/create-invoice`, request).pipe(
      tap(response => {
        console.log('PayDunya invoice created:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Check transaction status
   */
  getTransactionStatus(token: string): Observable<TransactionStatusResponse> {
    return this.http.get<TransactionStatusResponse>(`${this.apiUrl}/transactions/${token}/status`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get user's transactions
   */
  getUserTransactions(): Observable<PaydunyaTransaction[]> {
    return this.http.get<PaydunyaTransaction[]>(`${this.apiUrl}/transactions`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get transaction by ID
   */
  getTransaction(id: string): Observable<PaydunyaTransaction> {
    return this.http.get<PaydunyaTransaction>(`${this.apiUrl}/transactions/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Cancel transaction
   */
  cancelTransaction(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/transactions/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Error handling
   */
  private handleError(error: any): Observable<never> {
    console.error('PayDunya error:', error);
    let errorMessage = 'Une erreur est survenue lors du traitement du paiement';

    if (error.error?.error?.message) {
      errorMessage = error.error.error.message;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
