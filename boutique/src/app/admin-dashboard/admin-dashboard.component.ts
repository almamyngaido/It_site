import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface MonthRevenue {
  year: number;
  month: number;
  revenue: number;
  count: number;
}

interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
  };
  revenue: {
    total: number;
    byMonth: MonthRevenue[];
  };
  users: {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
  };
  products: {
    total: number;
    active: number;
    outOfStock: number;
    lowStock: number;
  };
  transactions: {
    total: number;
    completed: number;
    totalRevenue: number;
  };
  recentOrders: any[];
  generatedAt: string;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;

  stats: DashboardStats | null = null;
  isLoading = false;
  error: string | null = null;

  private chart: Chart | null = null;
  private destroy$ = new Subject<void>();
  private statsLoaded = false;

  readonly MONTHS_FR = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
    'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadStats();
  }

  ngAfterViewInit(): void {
    if (this.statsLoaded && this.stats) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStats(): void {
    this.isLoading = true;
    this.error = null;

    this.http.get<DashboardStats>(`${environment.apiUrl}/admin/dashboard`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.stats = data;
          this.isLoading = false;
          this.statsLoaded = true;
          // Render chart after view updates
          setTimeout(() => this.renderChart(), 0);
        },
        error: (err) => {
          this.error = err?.error?.error?.message ?? 'Erreur lors du chargement des statistiques.';
          this.isLoading = false;
        }
      });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 })
      .format(amount) + ' XOF';
  }

  getOrderSuccessRate(): number {
    if (!this.stats || this.stats.orders.total === 0) return 0;
    return Math.round((this.stats.orders.completed / this.stats.orders.total) * 100);
  }

  getTransactionSuccessRate(): number {
    if (!this.stats || this.stats.transactions.total === 0) return 0;
    return Math.round((this.stats.transactions.completed / this.stats.transactions.total) * 100);
  }

  getOrderStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      processing: 'En cours',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      completed: 'Terminée',
      cancelled: 'Annulée',
    };
    return labels[status] ?? status;
  }

  getPaymentStatusLabel(status: string): string {
    const labels: Record<string, string> = { pending: 'En attente', paid: 'Payée', failed: 'Échoué', refunded: 'Remboursée' };
    return labels[status] ?? status;
  }

  getPaymentStatusClass(status: string): string {
    const classes: Record<string, string> = {
      paid: 'badge-success', pending: 'badge-warning', failed: 'badge-danger', refunded: 'badge-info'
    };
    return classes[status] ?? 'badge-secondary';
  }

  getOrderStatusClass(status: string): string {
    const classes: Record<string, string> = {
      completed: 'badge-success', delivered: 'badge-success',
      pending: 'badge-warning', confirmed: 'badge-info',
      processing: 'badge-primary', shipped: 'badge-primary',
      cancelled: 'badge-danger'
    };
    return classes[status] ?? 'badge-secondary';
  }

  private buildChartData(): { labels: string[]; values: number[] } {
    const now = new Date();
    const labels: string[] = [];
    const values: number[] = [];

    // Build a lookup map from the API response
    const revenueMap = new Map<string, number>();
    if (this.stats?.revenue.byMonth) {
      for (const entry of this.stats.revenue.byMonth) {
        revenueMap.set(`${entry.year}-${entry.month}`, entry.revenue);
      }
    }

    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1; // 1-indexed
      labels.push(`${this.MONTHS_FR[d.getMonth()]} ${year}`);
      values.push(revenueMap.get(`${year}-${month}`) ?? 0);
    }

    return { labels, values };
  }

  private renderChart(): void {
    if (!this.revenueChartRef?.nativeElement) return;

    this.chart?.destroy();

    const { labels, values } = this.buildChartData();

    this.chart = new Chart(this.revenueChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Revenus (XOF)',
          data: values,
          backgroundColor: 'rgba(30, 58, 95, 0.75)',
          borderColor: '#1e3a5f',
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${this.formatCurrency(ctx.parsed.y)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                const n = Number(value);
                return n >= 1000 ? `${(n / 1000).toFixed(0)}k` : `${n}`;
              }
            }
          }
        }
      }
    });
  }
}
