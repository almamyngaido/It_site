import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Product, Category } from '../models/product.model';
import { ProductService } from '../services/product.service';
import { CategoryService } from '../services/category.service';
import { UploadService } from '../services/upload.service';

type Tab = 'products' | 'categories';

interface ProductForm {
  name: string;
  slug: string;
  description: string;
  price: number | null;
  compareAtPrice: number | null;
  sku: string;
  stockQuantity: number | null;
  categoryId: string;
  imageUrl: string;
  isActive: boolean;
  isFeatured: boolean;
}

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
}

@Component({
  selector: 'app-admin-catalogue',
  templateUrl: './admin-catalogue.component.html',
  styleUrls: ['./admin-catalogue.component.css']
})
export class AdminCatalogueComponent implements OnInit {

  activeTab: Tab = 'products';

  // Data
  products: Product[] = [];
  categories: Category[] = [];

  // UI state
  loadingProducts = false;
  loadingCategories = false;
  showProductModal = false;
  showCategoryModal = false;
  showDeleteConfirm = false;
  deleteTarget: { type: 'product' | 'category'; id: string; name: string } | null = null;
  saving = false;
  uploading = false;

  // Edit targets
  editingProduct: Product | null = null;
  editingCategory: Category | null = null;

  // Search
  productSearch = '';
  categorySearch = '';

  // Forms
  productForm: ProductForm = this.emptyProductForm();
  categoryForm: CategoryForm = this.emptyCategoryForm();

  // Image upload
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private uploadService: UploadService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  // ─── Tab ─────────────────────────────────────────────────────────

  setTab(tab: Tab): void {
    this.activeTab = tab;
  }

  // ─── Load data ───────────────────────────────────────────────────

  loadProducts(): void {
    this.loadingProducts = true;
    this.productService.getAllProducts().subscribe({
      next: products => { this.products = products; this.loadingProducts = false; },
      error: err => { this.toastr.error(err.message, 'Erreur'); this.loadingProducts = false; }
    });
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.categoryService.getAll().subscribe({
      next: cats => { this.categories = cats; this.loadingCategories = false; },
      error: err => { this.toastr.error(err.message, 'Erreur'); this.loadingCategories = false; }
    });
  }

  // ─── Filtering ───────────────────────────────────────────────────

  get filteredProducts(): Product[] {
    const q = this.productSearch.toLowerCase().trim();
    if (!q) return this.products;
    return this.products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      this.getCategoryName(p.categoryId).toLowerCase().includes(q)
    );
  }

  get filteredCategories(): Category[] {
    const q = this.categorySearch.toLowerCase().trim();
    if (!q) return this.categories;
    return this.categories.filter(c => c.name.toLowerCase().includes(q));
  }

  getCategoryName(categoryId: string): string {
    return this.categories.find(c => c.id === categoryId)?.name ?? '—';
  }

  // ─── Product CRUD ────────────────────────────────────────────────

  openNewProduct(): void {
    this.editingProduct = null;
    this.productForm = this.emptyProductForm();
    this.selectedFile = null;
    this.imagePreview = null;
    this.showProductModal = true;
  }

  openEditProduct(product: Product): void {
    this.editingProduct = product;
    this.productForm = {
      name: product.name,
      slug: product.slug,
      description: product.description ?? '',
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? null,
      sku: product.sku,
      stockQuantity: product.stockQuantity,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl ?? '',
      isActive: product.isActive ?? true,
      isFeatured: product.isFeatured
    };
    this.selectedFile = null;
    this.imagePreview = product.imageUrl ?? null;
    this.showProductModal = true;
  }

  closeProductModal(): void {
    this.showProductModal = false;
    this.editingProduct = null;
    this.selectedFile = null;
    this.imagePreview = null;
  }

  async saveProduct(): Promise<void> {
    if (this.saving || this.uploading) return;

    // Upload image first if a new file was selected
    if (this.selectedFile) {
      this.uploading = true;
      try {
        const result = await this.uploadService.uploadImage(this.selectedFile, 'products').toPromise();
        this.productForm.imageUrl = result!.url;
        this.uploading = false;
      } catch (err: any) {
        this.toastr.error(err.message, 'Erreur upload');
        this.uploading = false;
        return;
      }
    }

    this.saving = true;
    const payload: Partial<Product> = {
      name: this.productForm.name.trim(),
      slug: this.productForm.slug.trim(),
      description: this.productForm.description.trim(),
      price: this.productForm.price!,
      compareAtPrice: this.productForm.compareAtPrice ?? undefined,
      sku: this.productForm.sku.trim(),
      stockQuantity: this.productForm.stockQuantity!,
      categoryId: this.productForm.categoryId,
      imageUrl: this.productForm.imageUrl || undefined,
      isActive: this.productForm.isActive,
      isFeatured: this.productForm.isFeatured
    };

    if (this.editingProduct?.id) {
      this.productService.updateProduct(this.editingProduct.id, payload).subscribe({
        next: () => {
          this.toastr.success('Produit mis à jour', 'Succès');
          this.saving = false;
          this.closeProductModal();
          this.loadProducts();
        },
        error: err => { this.toastr.error(err.message, 'Erreur'); this.saving = false; }
      });
    } else {
      const now = new Date().toISOString();
      this.productService.createProduct({ ...payload, createdAt: now, updatedAt: now } as any).subscribe({
        next: () => {
          this.toastr.success('Produit créé', 'Succès');
          this.saving = false;
          this.closeProductModal();
          this.loadProducts();
        },
        error: err => { this.toastr.error(err.message, 'Erreur'); this.saving = false; }
      });
    }
  }

  // ─── Category CRUD ───────────────────────────────────────────────

  openNewCategory(): void {
    this.editingCategory = null;
    this.categoryForm = this.emptyCategoryForm();
    this.showCategoryModal = true;
  }

  openEditCategory(category: Category): void {
    this.editingCategory = category;
    this.categoryForm = {
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      imageUrl: category.imageUrl ?? '',
      isActive: category.isActive ?? true
    };
    this.showCategoryModal = true;
  }

  closeCategoryModal(): void {
    this.showCategoryModal = false;
    this.editingCategory = null;
  }

  saveCategory(): void {
    if (this.saving) return;
    this.saving = true;
    const now = new Date().toISOString();
    const payload: Partial<Category> = {
      name: this.categoryForm.name.trim(),
      slug: this.categoryForm.slug.trim(),
      description: this.categoryForm.description.trim(),
      imageUrl: this.categoryForm.imageUrl.trim() || undefined,
      isActive: this.categoryForm.isActive
    };

    if (this.editingCategory?.id) {
      this.categoryService.update(this.editingCategory.id, payload).subscribe({
        next: () => {
          this.toastr.success('Catégorie mise à jour', 'Succès');
          this.saving = false;
          this.closeCategoryModal();
          this.loadCategories();
        },
        error: err => { this.toastr.error(err.message, 'Erreur'); this.saving = false; }
      });
    } else {
      this.categoryService.create({ ...payload, createdAt: now, updatedAt: now } as any).subscribe({
        next: () => {
          this.toastr.success('Catégorie créée', 'Succès');
          this.saving = false;
          this.closeCategoryModal();
          this.loadCategories();
        },
        error: err => { this.toastr.error(err.message, 'Erreur'); this.saving = false; }
      });
    }
  }

  // ─── Delete ──────────────────────────────────────────────────────

  confirmDelete(type: 'product' | 'category', id: string, name: string): void {
    this.deleteTarget = { type, id, name };
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deleteTarget = null;
  }

  executeDelete(): void {
    if (!this.deleteTarget) return;
    const { type, id } = this.deleteTarget;
    this.showDeleteConfirm = false;

    const obs = type === 'product'
      ? this.productService.deleteProduct(id)
      : this.categoryService.delete(id);

    obs.subscribe({
      next: () => {
        this.toastr.success(type === 'product' ? 'Produit supprimé' : 'Catégorie supprimée', 'Succès');
        if (type === 'product') this.loadProducts();
        else this.loadCategories();
        this.deleteTarget = null;
      },
      error: err => {
        this.toastr.error(err.message, 'Erreur');
        this.deleteTarget = null;
      }
    });
  }

  // ─── Slug auto-generation ────────────────────────────────────────

  onProductNameChange(): void {
    if (!this.editingProduct) {
      this.productForm.slug = this.toSlug(this.productForm.name);
    }
  }

  onCategoryNameChange(): void {
    if (!this.editingCategory) {
      this.categoryForm.slug = this.toSlug(this.categoryForm.name);
    }
  }

  private toSlug(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  // ─── Image handling ──────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      this.toastr.warning('Format non supporté. Utilisez JPEG, PNG, WebP ou GIF.', 'Fichier invalide');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.toastr.warning('Le fichier ne doit pas dépasser 10 Mo.', 'Fichier trop grand');
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = e => { this.imagePreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
    this.imagePreview = this.editingProduct?.imageUrl ?? null;
    this.productForm.imageUrl = this.editingProduct?.imageUrl ?? '';
  }

  // ─── Helpers ─────────────────────────────────────────────────────

  private emptyProductForm(): ProductForm {
    return {
      name: '', slug: '', description: '',
      price: null, compareAtPrice: null,
      sku: '', stockQuantity: null,
      categoryId: '', imageUrl: '',
      isActive: true, isFeatured: false
    };
  }

  private emptyCategoryForm(): CategoryForm {
    return { name: '', slug: '', description: '', imageUrl: '', isActive: true };
  }

  isProductFormValid(): boolean {
    return !!(
      this.productForm.name.trim() &&
      this.productForm.slug.trim() &&
      this.productForm.sku.trim() &&
      this.productForm.price !== null && this.productForm.price >= 0 &&
      this.productForm.stockQuantity !== null && this.productForm.stockQuantity >= 0 &&
      this.productForm.categoryId
    );
  }

  isCategoryFormValid(): boolean {
    return !!(this.categoryForm.name.trim() && this.categoryForm.slug.trim());
  }

  trackById(_: number, item: { id?: string }): string {
    return item.id ?? '';
  }
}
