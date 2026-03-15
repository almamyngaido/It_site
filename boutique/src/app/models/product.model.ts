export interface Product {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stockQuantity: number;
  categoryId: string;
  imageUrl?: string;
  images?: string[];
  specifications?: any;
  isActive?: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface Category {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilter {
  categoryId?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  searchQuery?: string;
}
