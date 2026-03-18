// SSActivewear API Client
// Docs: https://api.ssactivewear.com/v2
// Auth: Basic (account:apikey)

const SSA_ACCOUNT = process.env.SSA_ACCOUNT || "";
const SSA_API_KEY = process.env.SSA_API_KEY || "";
const SSA_BASE_URL = "https://api.ssactivewear.com/v2";
const SSA_IMAGE_BASE = "https://www.ssactivewear.com/";

function getAuthHeader(): string {
  return "Basic " + Buffer.from(`${SSA_ACCOUNT}:${SSA_API_KEY}`).toString("base64");
}

function headers(): Record<string, string> {
  return {
    Authorization: getAuthHeader(),
    "Content-Type": "application/json",
    "User-Agent": "CreateAndSource/1.0",
  };
}

// ---------- Types ----------

export interface SSAStyle {
  styleID: number;
  brandName: string;
  styleName: string;
  title: string;
  description: string;
  baseCategory: string;
  styleImage: string | null;
  brandImage: string | null;
}

export interface SSAProduct {
  sku: string;
  styleID: number;
  brandName: string;
  styleName: string;
  colorName: string;
  color1: string | null; // hex
  sizeName: string;
  piecePrice: number;
  dozenPrice: number;
  casePrice: number;
  qty: number;
  colorFrontImage: string | null;
  colorBackImage: string | null;
  colorSideImage: string | null;
}

// ---------- Cache ----------

let stylesCache: { data: SSAStyle[]; timestamp: number } | null = null;
const productCache = new Map<number, { data: SSAProduct[]; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// ---------- Image Helper ----------

export function ssaImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  // If already a full URL, return as-is
  if (path.startsWith("http")) return path;
  // Strip leading slash if present to avoid double slash
  const cleaned = path.startsWith("/") ? path.slice(1) : path;
  return `${SSA_IMAGE_BASE}${cleaned}`;
}

// ---------- API Methods ----------

export async function getStyles(): Promise<SSAStyle[]> {
  if (stylesCache && Date.now() - stylesCache.timestamp < CACHE_TTL) {
    return stylesCache.data;
  }

  const res = await fetch(`${SSA_BASE_URL}/styles/`, {
    headers: headers(),
  });

  if (!res.ok) {
    console.error(`SSActivewear styles error: ${res.status} ${res.statusText}`);
    return stylesCache?.data || [];
  }

  const data: SSAStyle[] = await res.json();
  stylesCache = { data, timestamp: Date.now() };
  return data;
}

export async function getProducts(styleID: number): Promise<SSAProduct[]> {
  const cached = productCache.get(styleID);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const res = await fetch(`${SSA_BASE_URL}/products/?styleID=${styleID}`, {
    headers: headers(),
  });

  if (!res.ok) {
    console.error(`SSActivewear products error for style ${styleID}: ${res.status}`);
    return cached?.data || [];
  }

  const data: SSAProduct[] = await res.json();
  productCache.set(styleID, { data, timestamp: Date.now() });
  return data;
}

export async function searchStyles(query: string): Promise<SSAStyle[]> {
  const styles = await getStyles();
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter((w) => w.length > 0);

  return styles.filter((s) => {
    const searchable =
      `${s.brandName} ${s.styleName} ${s.title} ${s.baseCategory}`.toLowerCase();
    return words.every((word) => searchable.includes(word));
  });
}
