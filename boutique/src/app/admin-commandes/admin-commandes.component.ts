import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Order, OrderItem } from '../models/cart.model';

@Component({
  selector: 'app-admin-commandes',
  templateUrl: './admin-commandes.component.html',
  styleUrls: ['./admin-commandes.component.css']
})
export class AdminCommandesComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  selectedOrder: Order | null = null;

  isLoading = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Filters
  searchQuery = '';
  filterStatus = '';
  filterPayment = '';

  // Status update modal
  showStatusModal = false;
  updatingOrderId: string | null = null;
  newStatus = '';
  newPaymentStatus = '';

  readonly orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  readonly paymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.error = null;

    const filter = JSON.stringify({ include: [{ relation: 'orderItems' }], order: ['createdAt DESC'] });

    this.http.get<Order[]>(`${environment.apiUrl}/orders?filter=${filter}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders) => {
          this.orders = orders;
          this.applyFilters();
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Erreur lors du chargement des commandes.';
          this.isLoading = false;
        }
      });
  }

  applyFilters(): void {
    let result = [...this.orders];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(o =>
        o.orderNumber?.toLowerCase().includes(q) ||
        (o as any).guestEmail?.toLowerCase().includes(q) ||
        (o as any).guestName?.toLowerCase().includes(q)
      );
    }

    if (this.filterStatus) {
      result = result.filter(o => o.statud === this.filterStatus);
    }

    if (this.filterPayment) {
      result = result.filter(o => o.paymentStatus === this.filterPayment);
    }

    this.filteredOrders = result;
  }

  selectOrder(order: Order): void {
    this.selectedOrder = this.selectedOrder?.id === order.id ? null : order;
  }

  openStatusModal(order: Order): void {
    this.updatingOrderId = order.id!;
    this.newStatus = order.statud;
    this.newPaymentStatus = order.paymentStatus;
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.updatingOrderId = null;
  }

  saveStatus(): void {
    if (!this.updatingOrderId) return;

    const payload: any = {
      statud: this.newStatus,
      paymentStatus: this.newPaymentStatus,
      updateAt: new Date().toISOString()
    };

    this.http.patch(`${environment.apiUrl}/orders/${this.updatingOrderId}`, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const order = this.orders.find(o => o.id === this.updatingOrderId);
          if (order) {
            order.statud = this.newStatus;
            order.paymentStatus = this.newPaymentStatus;
          }
          if (this.selectedOrder?.id === this.updatingOrderId) {
            this.selectedOrder!.statud = this.newStatus;
            this.selectedOrder!.paymentStatus = this.newPaymentStatus;
          }
          this.applyFilters();
          this.closeStatusModal();
          this.showSuccess('Commande mise à jour avec succès.');
        },
        error: () => {
          this.error = 'Erreur lors de la mise à jour.';
          this.closeStatusModal();
        }
      });
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => this.successMessage = null, 3000);
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      processing: 'badge-primary',
      shipped: 'badge-purple',
      delivered: 'badge-success',
      cancelled: 'badge-danger',
    };
    return map[status] ?? 'badge-secondary';
  }

  getPaymentClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'badge-warning',
      paid: 'badge-success',
      failed: 'badge-danger',
      refunded: 'badge-secondary',
    };
    return map[status] ?? 'badge-secondary';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      processing: 'En cours',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    };
    return map[status] ?? status;
  }

  getPaymentLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'En attente',
      paid: 'Payée',
      failed: 'Échoué',
      refunded: 'Remboursée',
    };
    return map[status] ?? status;
  }

  isGuest(order: Order): boolean {
    return !!(order as any).isGuest;
  }

  getCustomerName(order: Order): string {
    const o = order as any;
    if (o.guestName) return o.guestName + ' (invité)';
    return 'Client #' + (order.userId?.slice(-6) ?? '?');
  }

  getCustomerEmail(order: Order): string {
    return (order as any).guestEmail ?? '—';
  }

  getCustomerPhone(order: Order): string {
    return (order as any).guestPhone ?? '—';
  }

  getOrderTotal(order: Order): string {
    return (order.total ?? 0).toLocaleString('fr-FR') + ' FCFA';
  }

  getItemCount(order: Order): number {
    return order.orderItems?.reduce((s, i) => s + i.quantity, 0) ?? 0;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
