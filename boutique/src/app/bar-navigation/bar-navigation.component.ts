import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { Cart, User } from '../models/cart.model';

@Component({
  selector: 'app-bar-navigation',
  templateUrl: './bar-navigation.component.html',
  styleUrls: ['./bar-navigation.component.css']
})
export class BarNavigationComponent implements OnInit, OnDestroy {
  cartItemCount: number = 0;
  currentUser: User | null = null;
  isLoggedIn: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Subscribe to cart changes
    this.cartService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cart => {
        this.cartItemCount = cart.itemCount;
      });

    // Subscribe to auth changes
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.isLoggedIn = !!user;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async logout(): Promise<void> {
    const confirmed = await this.notificationService.confirm(
      'Voulez-vous vraiment vous déconnecter?',
      'Confirmation de déconnexion'
    );

    if (confirmed) {
      this.authService.logout();
      this.notificationService.success('Vous avez été déconnecté avec succès', 'Déconnexion');
    }
  }
}
