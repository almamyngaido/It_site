import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProductService } from '../services/product.service';
import { CartService } from '../services/cart.service';
import { NotificationService } from '../services/notification.service';
import { Product, Category } from '../models/product.model';

@Component({
  selector: 'app-catalogue',
  templateUrl: './catalogue.component.html',
  styleUrls: ['./catalogue.component.css']
})
export class CatalogueComponent implements OnInit, OnDestroy {
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  paginatedProducts: Product[] = [];
  categories: { id: string, name: string, label: string }[] = [
    { id: 'all', name: 'all', label: 'Tous' }
  ];

  selectedCategory: string = 'all';
  searchQuery: string = '';
  isLoading: boolean = false;
  error: string | null = null;

  // Filters
  priceRange: { min: number, max: number } = { min: 0, max: 100000 };
  selectedPriceRange: { min: number, max: number } = { min: 0, max: 100000 };
  sortBy: string = 'newest'; // newest, price-asc, price-desc, name-asc
  showInStockOnly: boolean = false;
  showFeaturedOnly: boolean = false;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 9;
  totalPages: number = 1;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadProducts();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all products from the backend
   */
  loadProducts(): void {
    this.isLoading = true;
    this.error = null;

    this.productService.getAllProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.allProducts = products;
          this.filteredProducts = products;
          this.extractCategories(products);
          this.calculatePriceRange(products);
          this.applyAllFilters();
          this.isLoading = false;
          console.log("all the producst",this.allProducts);
        },
        error: (err) => {
          console.error('Error loading products:', err);
          this.error = 'Erreur lors du chargement des produits. Veuillez réessayer.';
          this.isLoading = false;
        }
      });
  }

  /**
   * Extract unique categories from products
   */
  private extractCategories(products: Product[]): void {
    const categoryMap = new Map<string, Category>();

    products.forEach(product => {
      if (product.category && !categoryMap.has(product.category.id!)) {
        categoryMap.set(product.category.id!, product.category);
      }
    });

    const uniqueCategories = Array.from(categoryMap.values()).map(cat => ({
      id: cat.id!,
      name: cat.slug,
      label: cat.name
    }));

    this.categories = [
      { id: 'all', name: 'all', label: 'Tous' },
      ...uniqueCategories
    ];
  }

  /**
   * Setup search with debounce
   */
  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  /**
   * Handle search input
   */
  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.searchSubject.next(this.searchQuery);
  }

  /**
   * Perform search
   */
  private performSearch(query: string): void {
    this.applyAllFilters();
  }

  /**
   * Select category
   */
  selectCategory(categoryId: string): void {
    this.selectedCategory = categoryId;

    if (this.searchQuery.trim()) {
      this.performSearch(this.searchQuery);
    } else {
      this.filterByCategory();
    }
  }

  /**
   * Filter products by category
   */
  private filterByCategory(): void {
    this.applyAllFilters();
  }

  /**
   * Calculate price range from products
   */
  private calculatePriceRange(products: Product[]): void {
    if (products.length === 0) return;

    const prices = products.map(p => p.price);
    this.priceRange.min = Math.floor(Math.min(...prices));
    this.priceRange.max = Math.ceil(Math.max(...prices));
    this.selectedPriceRange = { ...this.priceRange };
  }

  /**
   * Apply all filters (category, price, stock, featured, search, sort)
   */
  applyAllFilters(): void {
    let products = [...this.allProducts];

    // Filter by category
    if (this.selectedCategory !== 'all') {
      products = products.filter(p => p.category?.id === this.selectedCategory);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query)
      );
    }

    // Filter by price range
    products = products.filter(p =>
      p.price >= this.selectedPriceRange.min &&
      p.price <= this.selectedPriceRange.max
    );

    // Filter by stock availability
    if (this.showInStockOnly) {
      products = products.filter(p => this.isInStock(p));
    }

    // Filter by featured
    if (this.showFeaturedOnly) {
      products = products.filter(p => p.isFeatured);
    }

    // Apply sorting
    this.sortProducts(products);

    this.filteredProducts = products;
    this.currentPage = 1;
    this.updatePagination();
  }

  /**
   * Sort products based on selected option
   */
  private sortProducts(products: Product[]): void {
    switch (this.sortBy) {
      case 'price-asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        products.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }
  }

  /**
   * Change sort option
   */
  changeSortOption(sortBy: string): void {
    this.sortBy = sortBy;
    this.applyAllFilters();
  }

  /**
   * Toggle in stock only filter
   */
  toggleInStockOnly(): void {
    this.showInStockOnly = !this.showInStockOnly;
    this.applyAllFilters();
  }

  /**
   * Toggle featured only filter
   */
  toggleFeaturedOnly(): void {
    this.showFeaturedOnly = !this.showFeaturedOnly;
    this.applyAllFilters();
  }

  /**
   * Update price range filter
   */
  updatePriceRange(): void {
    this.applyAllFilters();
  }

  /**
   * Reset all filters
   */
  resetFilters(): void {
    this.selectedCategory = 'all';
    this.searchQuery = '';
    this.selectedPriceRange = { ...this.priceRange };
    this.sortBy = 'newest';
    this.showInStockOnly = false;
    this.showFeaturedOnly = false;
    this.applyAllFilters();
  }

  /**
   * Check if product is in stock
   */
  isInStock(product: Product): boolean {
    return this.productService.isInStock(product);
  }

  /**
   * Get discount percentage
   */
  getDiscountPercentage(product: Product): number | null {
    return this.productService.getDiscountPercentage(product);
  }

  /**
   * Get product image URL
   */
  getProductImage(product: Product): string {
    if (product.imageUrl) {
      return product.imageUrl;
    }
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return 'assets/it_newLogo.jpg'; // Fallback image
  }

  /**
   * Track by function for ngFor performance
   */
  trackByProductId(index: number, product: Product): string {
    return product.id!;
  }

  /**
   * Update pagination based on filtered products
   */
  private updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);

    // Ensure current page is within valid range
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

  /**
   * Go to specific page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  /**
   * Get array of page numbers for pagination controls
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    if (this.totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let startPage = Math.max(1, this.currentPage - 2);
      let endPage = Math.min(this.totalPages, this.currentPage + 2);

      // Adjust if we're near the start or end
      if (this.currentPage <= 3) {
        endPage = maxPagesToShow;
      } else if (this.currentPage >= this.totalPages - 2) {
        startPage = this.totalPages - maxPagesToShow + 1;
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  /**
   * Add product to cart
   */
  addToCart(product: Product, event: Event): void {
    event.stopPropagation();
    this.cartService.addToCart(product, 1);
    this.notificationService.itemAddedToCart(product.name);
  }
}
