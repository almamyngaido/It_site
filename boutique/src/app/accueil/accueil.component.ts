import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CartService } from '../services/cart.service';
import { ProductService } from '../services/product.service';
import { NotificationService } from '../services/notification.service';
import { Product } from '../models/product.model';

@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.css']
})
export class AccueilComponent implements OnInit, OnDestroy {

  featuredProducts: Product[] = [];
  isLoadingFeatured = false;

  private destroy$ = new Subject<void>();

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadFeaturedProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFeaturedProducts(): void {
    this.isLoadingFeatured = true;
    this.productService.getFeaturedProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: products => {
          this.featuredProducts = products;
          this.isLoadingFeatured = false;
        },
        error: () => {
          this.isLoadingFeatured = false;
        }
      });
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
    this.notificationService.itemAddedToCart(product.name);
  }

  isInStock(product: Product): boolean {
    return product.stockQuantity > 0;
  }

  getProductImage(product: Product): string {
    return product.imageUrl || product.images?.[0] || 'assets/it_newLogo.jpg';
  }
}
