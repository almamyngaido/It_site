import { Product } from './product.model';

export interface CartItem {
  id?: string;
  productId: string;
  product?: Product;
  quantity: number;
  price: number;
  subtotal?: number;
}

export interface Cart {
  id?: string;
  userId?: string;
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface Order {
  id?: string;
  userId: string;
  orderNumber: string;
  statud: string; // Backend has typo: 'statud' instead of 'status'
  subtotal: number;
  tax: number;
  shippingCost?: number;
  total: number;
  shippingAdressId?: string;
  billingAdress?: string;
  paymentMethod?: string;
  paymentStatus: string;
  metadata?: object;
  orderDtate?: string; // Backend has typo: 'orderDtate' instead of 'orderDate'
  createdAt?: string;
  updateAt?: string; // Backend has typo: 'updateAt' instead of 'updatedAt'
  orderItems?: OrderItem[];
}

export interface OrderItem {
  id?: string;
  orderId?: string;
  productId: string;
  productName: string;
  productSku: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt?: string;
  metadata?: any;
}

export interface Address {
  id?: string;
  userId?: string;
  type?: string;
  firstName: string;
  lastname: string; // Backend has typo: 'lastname' instead of 'lastName'
  company?: string;
  adress: string; // Backend has typo: 'adress' instead of 'address'
  city: string;
  region: string;
  postalCode?: string;
  country: string;
  phone: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export interface User {
  id?: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}
