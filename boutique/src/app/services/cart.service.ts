import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Cart, CartItem, Order, OrderItem, Address } from '../models/cart.model';
import { Product } from '../models/product.model';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/orders`;
  private cartSubject = new BehaviorSubject<Cart>(this.getInitialCart());
  public cart$ = this.cartSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.loadCartFromStorage();
  }

  /**
   * Get initial empty cart
   */
  private getInitialCart(): Cart {
    return {
      items: [],
      total: 0,
      itemCount: 0
    };
  }

  /**
   * Load cart from localStorage
   */
  private loadCartFromStorage(): void {
    const cartStr = localStorage.getItem('shopping_cart');
    if (cartStr) {
      try {
        const cart = JSON.parse(cartStr);
        this.cartSubject.next(cart);
      } catch (e) {
        console.error('Error parsing cart from storage:', e);
      }
    }
  }

  /**
   * Save cart to localStorage
   */
  private saveCartToStorage(cart: Cart): void {
    localStorage.setItem('shopping_cart', JSON.stringify(cart));
  }

  /**
   * Get current cart
   */
  getCart(): Cart {
    return this.cartSubject.value;
  }

  /**
   * Add item to cart
   */
  addToCart(product: Product, quantity: number = 1): void {
    const cart = this.getCart();
    const existingItem = cart.items.find(item => item.productId === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.subtotal = existingItem.quantity * existingItem.price;
    } else {
      const newItem: CartItem = {
        productId: product.id!,
        product: product,
        quantity: quantity,
        price: product.price,
        subtotal: product.price * quantity
      };
      cart.items.push(newItem);
    }

    this.updateCartTotals(cart);
    this.cartSubject.next(cart);
    this.saveCartToStorage(cart);
  }

  /**
   * Update item quantity
   */
  updateQuantity(productId: string, quantity: number): void {
    const cart = this.getCart();
    const item = cart.items.find(item => item.productId === productId);

    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        item.subtotal = item.quantity * item.price;
        this.updateCartTotals(cart);
        this.cartSubject.next(cart);
        this.saveCartToStorage(cart);
      }
    }
  }

  /**
   * Remove item from cart
   */
  removeFromCart(productId: string): void {
    const cart = this.getCart();
    cart.items = cart.items.filter(item => item.productId !== productId);
    this.updateCartTotals(cart);
    this.cartSubject.next(cart);
    this.saveCartToStorage(cart);
  }

  /**
   * Clear cart
   */
  clearCart(): void {
    const cart = this.getInitialCart();
    this.cartSubject.next(cart);
    this.saveCartToStorage(cart);
  }

  /**
   * Update cart totals
   */
  private updateCartTotals(cart: Cart): void {
    cart.itemCount = cart.items.reduce((count, item) => count + item.quantity, 0);
    cart.total = cart.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  }

  /**
   * Create order from cart — works for both authenticated users and guests.
   * Items are embedded in the POST body; the server creates OrderItem records.
   */
  createOrder(
    shippingAddress: Address,
    guestInfo?: {name: string; email: string; phone: string}
  ): Observable<Order> {
    const cart = this.getCart();
    const user = this.authService.getCurrentUser();
    const isGuest = !user;

    if (isGuest && !guestInfo) {
      return throwError(() => new Error('Les informations invité sont requises pour passer commande.'));
    }

    const items = cart.items.map(item => ({
      productId: item.productId,
      productName: item.product?.name || 'Produit',
      productSku: item.product?.sku || 'N/A',
      quantity: item.quantity,
      unitPrice: item.price,
    }));

    const subtotal = cart.total;
    const shippingCost = subtotal > 50000 ? 0 : 2000;
    const total = subtotal + shippingCost;

    const orderData: any = {
      items,
      subtotal,
      tax: 0,
      shippingCost,
      total,
      paymentMethod: 'paydunya',
      paymentStatus: 'pending',
      shippingAddress,
    };

    if (isGuest) {
      orderData.guestName = guestInfo!.name;
      orderData.guestEmail = guestInfo!.email;
      orderData.guestPhone = guestInfo!.phone;
    }

    return this.http.post<Order>(this.apiUrl, orderData).pipe(
      tap(() => this.clearCart()),
      catchError(this.handleError)
    );
  }

  /**
   * Get user orders
   */
  getUserOrders(): Observable<Order[]> {
    const user = this.authService.getCurrentUser();

    if (!user) {
      return throwError(() => new Error('Vous devez être connecté'));
    }

    return this.http.get<Order[]>(`${this.apiUrl}?filter=${JSON.stringify({
      where: { userId: user.id },
      include: [{ relation: 'orderItems' }],
      order: ['createdAt DESC']
    })}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get order by ID
   */
  getOrderById(orderId: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${orderId}?filter=${JSON.stringify({
      include: [{ relation: 'orderItems' }]
    })}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get cart item count
   */
  getItemCount(): number {
    return this.getCart().itemCount;
  }

  /**
   * Get cart total
   */
  getTotal(): number {
    return this.getCart().total;
  }

  /**
   * Error handling
   */
  private handleError(error: any): Observable<never> {
    console.error('Cart error:', error);
    return throwError(() => new Error(error.message || 'Server error'));
  }
}
