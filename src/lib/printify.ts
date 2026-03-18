// ============================================
// Printify API Client
// Docs: developers.printify.com
// ============================================

const API_KEY = process.env.PRINTIFY_API_KEY!;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID!;
const BASE_URL = "https://api.printify.com/v1";

async function printifyRequest(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      `Printify API error ${res.status}: ${JSON.stringify(error)}`
    );
  }

  return res.json();
}

// Get all available blueprints (product templates)
export async function getBlueprints() {
  return printifyRequest("/catalog/blueprints.json");
}

// Get blueprint details with available print providers
export async function getBlueprint(blueprintId: number) {
  return printifyRequest(`/catalog/blueprints/${blueprintId}.json`);
}

// Get print providers for a blueprint
export async function getPrintProviders(blueprintId: number) {
  return printifyRequest(
    `/catalog/blueprints/${blueprintId}/print_providers.json`
  );
}

// Get variants (sizes/colors) for a blueprint + print provider
export async function getVariants(blueprintId: number, printProviderId: number) {
  return printifyRequest(
    `/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`
  );
}

// Create a product in your Printify shop
export async function createPrintifyProduct(params: {
  title: string;
  description: string;
  blueprintId: number;
  printProviderId: number;
  variants: Array<{
    id: number;
    price: number;
    is_enabled: boolean;
  }>;
  printAreas: Array<{
    variant_ids: number[];
    placeholders: Array<{
      position: string;
      images: Array<{
        id: string;
        x: number;
        y: number;
        scale: number;
        angle: number;
      }>;
    }>;
  }>;
}) {
  return printifyRequest(`/shops/${SHOP_ID}/products.json`, {
    method: "POST",
    body: JSON.stringify({
      title: params.title,
      description: params.description,
      blueprint_id: params.blueprintId,
      print_provider_id: params.printProviderId,
      variants: params.variants,
      print_areas: params.printAreas,
    }),
  });
}

// Submit an order to Printify
export async function createPrintifyOrder(params: {
  externalId: string;
  items: Array<{
    productId: string;
    variantId: number;
    quantity: number;
  }>;
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  email: string;
}) {
  return printifyRequest(`/shops/${SHOP_ID}/orders.json`, {
    method: "POST",
    body: JSON.stringify({
      external_id: params.externalId,
      line_items: params.items.map((item) => ({
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
      })),
      shipping_method: 1,
      send_shipping_notification: true,
      address_to: {
        first_name: params.shippingAddress.name.split(" ")[0],
        last_name: params.shippingAddress.name.split(" ").slice(1).join(" "),
        email: params.email,
        address1: params.shippingAddress.line1,
        address2: params.shippingAddress.line2 || "",
        city: params.shippingAddress.city,
        region: params.shippingAddress.state,
        zip: params.shippingAddress.zip,
        country: params.shippingAddress.country,
      },
    }),
  });
}

// Get order status
export async function getPrintifyOrder(orderId: string) {
  return printifyRequest(`/shops/${SHOP_ID}/orders/${orderId}.json`);
}

// Upload an image to Printify
export async function uploadImage(params: {
  file_name: string;
  url: string;
}) {
  return printifyRequest("/uploads/images.json", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
