import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';
import { User, Order } from '../models/cart.model';

@Component({
  selector: 'app-profil',
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  orders: Order[] = [];
  isLoading: boolean = false;
  isEditMode: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;

  editForm: Partial<User> = {};

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if user is logged in
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (!user) {
          this.router.navigate(['/panier']);
        } else {
          this.loadOrders();
          this.initEditForm();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize edit form with current user data
   */
  private initEditForm(): void {
    if (this.currentUser) {
      this.editForm = {
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName,
        phone: this.currentUser.phone,
        email: this.currentUser.email
      };
    }
  }

  /**
   * Load user orders
   */
  loadOrders(): void {
    this.isLoading = true;
    this.error = null;

    this.cartService.getUserOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders) => {
          this.orders = orders;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading orders:', err);
          this.error = 'Erreur lors du chargement des commandes.';
          this.isLoading = false;
        }
      });
  }

  /**
   * Toggle edit mode
   */
  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.initEditForm();
      this.error = null;
      this.successMessage = null;
    }
  }

  /**
   * Save profile changes
   */
  saveProfile(): void {
    if (!this.currentUser?.id) return;

    this.isLoading = true;
    this.error = null;
    this.successMessage = null;

    this.authService.updateProfile(this.currentUser.id, this.editForm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser) => {
          this.isLoading = false;
          this.successMessage = 'Profil mis à jour avec succès!';
          this.isEditMode = false;
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: (err) => {
          this.isLoading = false;
          this.error = err.message || 'Erreur lors de la mise à jour du profil.';
        }
      });
  }

  /**
   * Get order status label
   */
  getOrderStatusLabel(status: string): string {
    const statusMap: any = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'processing': 'En cours',
      'shipped': 'Expédiée',
      'delivered': 'Livrée',
      'cancelled': 'Annulée'
    };
    return statusMap[status] || status;
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(status: string): string {
    const classMap: any = {
      'pending': 'badge-warning',
      'confirmed': 'badge-info',
      'processing': 'badge-primary',
      'shipped': 'badge-success',
      'delivered': 'badge-success',
      'cancelled': 'badge-danger'
    };
    return classMap[status] || 'badge-secondary';
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
