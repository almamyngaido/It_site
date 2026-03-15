import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PaydunyaService, PaydunyaTransaction } from '../services/paydunya.service';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.css']
})
export class PaymentSuccessComponent implements OnInit, OnDestroy {
  transaction: PaydunyaTransaction | null = null;
  isLoading: boolean = true;
  error: string | null = null;
  orderNumber: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paydunyaService: PaydunyaService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    // Get token from query params or localStorage (fallback)
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        console.log('🔍 Payment Success - URL Params:', params);
        let token = params['token'];

        // Fallback: Try to get token from localStorage if not in URL
        if (!token) {
          console.log('⚠️ No token in URL, checking localStorage...');
          token = localStorage.getItem('paydunya_transaction_token');
          if (token) {
            console.log('✅ Token found in localStorage:', token);
            // Clear it from localStorage after retrieving
            localStorage.removeItem('paydunya_transaction_token');
          }
        } else {
          console.log('✅ Token found in URL:', token);
        }

        if (token) {
          this.checkTransactionStatus(token);
        } else {
          console.error('❌ No token found in URL or localStorage');
          this.error = 'Token de transaction manquant';
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check transaction status
   */
  checkTransactionStatus(token: string): void {
    console.log('📡 Checking transaction status for token:', token);

    this.paydunyaService.getTransactionStatus(token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Transaction status response:', response);
          console.log('📊 PayDunya Status:', response.paydunyaStatus);

          this.transaction = response.transaction;
          this.isLoading = false;

          // Check PayDunya's status (from their API) vs our database status
          const paydunyaStatus = response.paydunyaStatus?.status?.toLowerCase();
          console.log('🔍 PayDunya API says:', paydunyaStatus);
          console.log('🔍 Our database says:', this.transaction.status);

          // If PayDunya says completed but our DB says pending, use PayDunya's status
          if (paydunyaStatus === 'completed' || paydunyaStatus === 'paid') {
            console.log('✅ Payment completed on PayDunya - updating local status');
            this.transaction.status = 'completed';
            this.cartService.clearCart();
          } else if (this.transaction.status === 'completed') {
            console.log('✅ Payment completed in database - clearing cart');
            this.cartService.clearCart();
          } else {
            console.log('⏳ Payment status:', this.transaction.status);
          }
        },
        error: (err) => {
          console.error('❌ Error checking transaction status:', err);
          this.error = err.message || 'Erreur lors de la vérification du paiement';
          this.isLoading = false;
        }
      });
  }

  /**
   * Continue shopping
   */
  continueShopping(): void {
    this.router.navigate(['/catalogue']);
  }

  /**
   * View orders
   */
  viewOrders(): void {
    this.router.navigate(['/profil']);
  }

  /**
   * Go to home
   */
  goHome(): void {
    this.router.navigate(['/']);
  }
}
