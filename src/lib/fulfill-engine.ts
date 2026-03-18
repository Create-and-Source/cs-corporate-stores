// ============================================
// Fulfill Engine API Client
// Docs: help.fulfillengine.com/en/api-guide
// ============================================

const ACCOUNT_ID = process.env.FULFILL_ENGINE_ACCOUNT_ID!;
const API_KEY = process.env.FULFILL_ENGINE_API_KEY!;
const BASE_URL = "https://api.fulfillengine.com";

async function feRequest(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": API_KEY,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      `Fulfill Engine API error ${res.status}: ${JSON.stringify(error)}`
    );
  }

  return res.json();
}

// Submit an order to Fulfill Engine
export async function createFulfillEngineOrder(params: {
  customId: string;
  items: Array<{
    sku: string;
    quantity: number;
    designId?: string;
    artworkUrl?: string;
    printingMethod?: string;
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
  const orderItemGroups = params.items.map((item, i) => ({
    id: `item-${i}`,
    sku: item.sku,
    quantity: item.quantity,
    ...(item.artworkUrl
      ? {
          designData: {
            artwork: [
              {
                originalFileUrl: item.artworkUrl,
                printingMethod: item.printingMethod || "dtf",
              },
            ],
          },
        }
      : {}),
    ...(item.designId ? { designId: item.designId } : {}),
  }));

  return feRequest(`/accounts/${ACCOUNT_ID}/orders`, {
    method: "POST",
    body: JSON.stringify({
      customId: params.customId,
      confirmationEmailAddress: params.email,
      orderItemGroups,
      shipments: [
        {
          shippingTier: "economy",
          confirmationEmailAddress: params.email,
          address: {
            name: params.shippingAddress.name,
            address1: params.shippingAddress.line1,
            address2: params.shippingAddress.line2 || "",
            city: params.shippingAddress.city,
            state: params.shippingAddress.state,
            postalCode: params.shippingAddress.zip,
            country: params.shippingAddress.country,
          },
          items: orderItemGroups.map((g) => ({
            orderItemGroupId: g.id,
            quantity: g.quantity,
          })),
        },
      ],
    }),
  });
}

// Get catalog products
export async function getFulfillEngineCatalog() {
  return feRequest(`/accounts/${ACCOUNT_ID}/catalog/products`);
}

// Get order status
export async function getFulfillEngineOrder(orderId: string) {
  return feRequest(`/accounts/${ACCOUNT_ID}/orders/${orderId}`);
}

// Check inventory for a SKU
export async function checkInventory(sku: string) {
  return feRequest(`/accounts/${ACCOUNT_ID}/inventory?sku=${sku}`);
}
