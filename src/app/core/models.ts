export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice: number | null;
  rating: number;
  reviews: number;
  image: string;
  color: string;
  description: string;
  stock: number;
  featured: boolean;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  city: string;
  joined: string;
  orders: number;
  spent: number;
  status: 'Active' | 'New';
}

export interface Order {
  id: number;
  userId: number;
  date: string;
  status: 'Delivered' | 'Processing' | 'Shipped' | 'Cancelled';
  items: { productId: number; quantity: number; price: number }[];
  total: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
export type Scenario = 'normal' | 'empty' | 'error';

export function readScenario(value: string | null): Scenario {
  return value === 'empty' || value === 'error' ? value : 'normal';
}
export interface DemoAccount {
  name: string;
  email: string;
}

export interface DemoAuthResult {
  message: string;
  account?: DemoAccount;
}
export interface RecoveryState {
  step: number;
  email: string;
  verified: boolean;
}
