// ============================================
// Create & Source — Corporate Stores Types
// ============================================

// --- Store ---
export interface Store {
  id: string;
  slug: string; // URL-friendly name (e.g., "acme-corp")
  company_name: string;
  logo_url: string | null;
  primary_color: string; // hex color for branding
  secondary_color: string;
  welcome_message: string | null;
  is_active: boolean;
  created_at: string;
}

// --- Users ---
export type UserRole = "employee" | "company_admin" | "cs_admin";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  store_id: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

// --- Credits ---
export interface CreditBalance {
  id: string;
  user_id: string;
  store_id: string;
  balance: number; // in cents
  lifetime_received: number;
  lifetime_spent: number;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  store_id: string;
  amount: number; // positive = credit added, negative = spent
  type: "bonus" | "new_hire" | "holiday" | "purchase" | "refund" | "manual";
  description: string;
  order_id: string | null;
  created_by: string; // admin user id
  created_at: string;
}

// --- Products ---
export type FulfillmentProvider = "fulfill_engine" | "printify";

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description: string;
  price: number; // retail price in cents (what employee "pays" in credits)
  cost: number; // wholesale cost in cents (what you pay)
  images: string[];
  category: string;
  fulfillment_provider: FulfillmentProvider;
  provider_product_id: string; // SKU or Printify blueprint ID
  provider_variant_id: string;
  sizes: string[];
  colors: string[];
  is_active: boolean;
  created_at: string;
}

// --- Cart ---
export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
  color: string;
}

// --- Orders ---
export type OrderStatus =
  | "pending"
  | "submitted"
  | "in_production"
  | "shipped"
  | "delivered"
  | "canceled";

export interface Order {
  id: string;
  store_id: string;
  user_id: string;
  items: OrderItem[];
  total: number; // in cents
  status: OrderStatus;
  tracking_number: string | null;
  tracking_url: string | null;
  shipping_carrier: string | null;
  shipping_address: ShippingAddress;
  fulfillment_provider: FulfillmentProvider;
  provider_order_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  size: string;
  color: string;
  price: number;
  image_url: string;
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}
