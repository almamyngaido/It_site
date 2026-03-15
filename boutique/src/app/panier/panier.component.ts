import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';
import { PaydunyaService } from '../services/paydunya.service';
import { NotificationService } from '../services/notification.service';
import { Cart, CartItem, Order, Address, LoginCredentials, User } from '../models/cart.model';

@Component({
  selector: 'app-panier',
  templateUrl: './panier.component.html',
  styleUrls: ['./panier.component.css']
})
export class PanierComponent implements OnInit, OnDestroy {
  cart: Cart = { items: [], total: 0, itemCount: 0 };
  isLoggedIn: boolean = false;
  currentUser: User | null = null;

  // UI States
  showLoginModal: boolean = false;
  showCheckoutForm: boolean = false;
  isLoading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Login/Register
  isRegistering: boolean = false;
  loginForm: LoginCredentials = { email: '', password: '' };
  registerForm: User = { email: '', password: '', firstName: '', lastName: '', phone: '' };

  // Checkout
  guestEmail: string = '';
  shippingAddress: Address = {
    firstName: '',
    lastname: '',
    adress: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'Sénégal',
    phone: '',
    isDefault: false
  };
  billingAddress: Address | null = null;
  useSameAddress: boolean = true;

  private destroy$ = new Subject<void>();

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private paydunyaService: PaydunyaService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to cart changes
    this.cartService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cart => {
        this.cart = cart;
      });

    // Subscribe to auth changes
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.isLoggedIn = !!user;
        if (user) {
          this.prefillShippingAddress(user);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Prefill shipping address from user data
   */
  private prefillShippingAddress(user: User): void {
    if (user.firstName) {
      this.shippingAddress.firstName = user.firstName;
    }
    if (user.lastName) {
      this.shippingAddress.lastname = user.lastName;
    }
    if (user.phone) {
      this.shippingAddress.phone = user.phone;
    }
  }

  /**
   * Update item quantity
   */
  updateQuantity(item: CartItem, change: number): void {
    const newQuantity = item.quantity + change;
    if (newQuantity > 0) {
      this.cartService.updateQuantity(item.productId, newQuantity);
    }
  }

  /**
   * Remove item from cart
   */
  async removeItem(item: CartItem): Promise<void> {
    const confirmed = await this.notificationService.confirm(
      'Voulez-vous vraiment retirer cet article du panier?',
      'Confirmer la suppression'
    );

    if (confirmed) {
      this.cartService.removeFromCart(item.productId);
      this.notificationService.itemRemovedFromCart();
    }
  }

  /**
   * Clear entire cart
   */
  async clearCart(): Promise<void> {
    const confirmed = await this.notificationService.confirm(
      'Voulez-vous vraiment vider le panier?',
      'Vider le panier'
    );

    if (confirmed) {
      this.cartService.clearCart();
      this.notificationService.cartCleared();
    }
  }

  /**
   * Continue shopping
   */
  continueShopping(): void {
    this.router.navigate(['/catalogue']);
  }

  /**
   * Proceed to checkout — always show form; login modal offers sign-in OR guest option
   */
  proceedToCheckout(): void {
    if (!this.isLoggedIn) {
      this.showLoginModal = true;
    } else {
      this.showCheckoutForm = true;
    }
  }

  /**
   * Continue as guest — close modal, show checkout form
   */
  continueAsGuest(): void {
    this.showLoginModal = false;
    this.error = null;
    this.showCheckoutForm = true;
  }

  /**
   * Login
   */
  login(): void {
    this.isLoading = true;
    this.error = null;

    this.authService.login(this.loginForm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.showLoginModal = false;
          this.showCheckoutForm = true;
          this.loginForm = { email: '', password: '' };
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
    this.isLoading = true;
    this.error = null;

    // Add default role and isActive for new users
    const registrationData = {
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
          this.registerForm = { email: '', password: '', firstName: '', lastName: '', phone: '' };

          // Switch to login form after 5 seconds
          setTimeout(() => {
            this.isRegistering = false;
            this.successMessage = 'Veuillez vérifier votre email et vous connecter pour continuer.';

            // Clear the success message after another 3 seconds
            setTimeout(() => {
              this.successMessage = null;
            }, 3000);
          }, 5000);
        },
        error: (err) => {
          this.isLoading = false;
          this.error = err.message || 'Erreur lors de l\'inscription.';
        }
      });
  }

  /**
   * Toggle between login and register
   */
  toggleAuthMode(): void {
    this.isRegistering = !this.isRegistering;
    this.error = null;
  }

  /**
   * Submit order with PayDunya payment
   */
  submitOrder(): void {
    if (!this.validateCheckoutForm()) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    const customerName = `${this.shippingAddress.firstName} ${this.shippingAddress.lastname}`;
    const customerPhone = this.shippingAddress.phone;
    const customerEmail = this.isLoggedIn ? this.currentUser?.email : this.guestEmail;

    const guestInfo = !this.isLoggedIn ? {
      name: customerName,
      email: this.guestEmail,
      phone: customerPhone
    } : undefined;

    // Step 1: Create order (items embedded, server creates OrderItem records)
    this.cartService.createOrder(this.shippingAddress, guestInfo)
      .pipe(
        takeUntil(this.destroy$),
        // Step 2: Create PayDunya invoice
        switchMap((createdOrder) => {
          const invoicePayload: any = {
            orderId: createdOrder.id!,
            customerName,
            customerEmail,
            customerPhone,
          };
          if (!this.isLoggedIn) {
            invoicePayload.guestEmail = this.guestEmail;
          }
          return this.paydunyaService.createInvoice(invoicePayload).pipe(
            takeUntil(this.destroy$)
          );
        })
      )
      .subscribe({
        next: (invoiceResponse) => {
          this.isLoading = false;
          this.successMessage = 'Redirection vers la page de paiement...';
          localStorage.setItem('paydunya_transaction_token', invoiceResponse.transaction.paydunyaToken);
          setTimeout(() => {
            window.location.href = invoiceResponse.checkoutUrl;
          }, 1000);
        },
        error: (err) => {
          this.isLoading = false;
          this.error = err.message || 'Erreur lors de la création de la commande.';
        }
      });
  }

  /**
   * Validate checkout form
   */
  private validateCheckoutForm(): boolean {
    if (!this.shippingAddress.firstName || !this.shippingAddress.lastname ||
        !this.shippingAddress.adress || !this.shippingAddress.city ||
        !this.shippingAddress.region || !this.shippingAddress.country ||
        !this.shippingAddress.phone) {
      this.error = 'Veuillez remplir tous les champs obligatoires.';
      return false;
    }
    if (!this.isLoggedIn && !this.guestEmail.trim()) {
      this.error = 'Veuillez saisir votre adresse email.';
      return false;
    }
    if (!this.isLoggedIn) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.guestEmail)) {
        this.error = 'L\'adresse email n\'est pas valide.';
        return false;
      }
    }
    return true;
  }

  /**
   * Cancel checkout
   */
  cancelCheckout(): void {
    this.showCheckoutForm = false;
    this.error = null;
  }

  /**
   * Close login modal
   */
  closeLoginModal(): void {
    this.showLoginModal = false;
    this.error = null;
  }

  /**
   * Get product image
   */
  getProductImage(item: CartItem): string {
    if (item.product?.imageUrl) {
      return item.product.imageUrl;
    }
    if (item.product?.images && item.product.images.length > 0) {
      return item.product.images[0];
    }
    return '../assets/slide3.jpg';
  }

  /**
   * Calculate shipping cost
   */
  getShippingCost(): number {
    return this.cart.total > 50000 ? 0 : 2000; // Free shipping over 50,000 FCFA
  }

  /**
   * Get grand total including shipping
   */
  getGrandTotal(): number {
    return this.cart.total + this.getShippingCost();
  }
}
