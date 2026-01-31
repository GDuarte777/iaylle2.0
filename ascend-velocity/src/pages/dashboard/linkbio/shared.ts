import type { CustomStyle } from "@/components/AdvancedColorPicker";
import { toast } from "sonner";

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
  enabled: boolean;
  animation?: "none" | "pulse" | "bounce" | "glow" | "shake" | "wiggle" | "tada" | "float" | "jello";
  type?: "simple" | "product" | "featured";
  price?: string;
  description?: string;
  image?: string;
  category?: string;
  currency?: string;
  buttonLabel?: string;
  badgeLabel?: string;
  badgeColor?: string;
  titleFontSize?: number;
  customStyle?: CustomStyle;
}

export interface ThemeConfig {
  backgroundType: "solid" | "gradient" | "image";
  backgroundColor: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  backgroundImage: string;
  layout: "classic" | "grid" | "shop";
  buttonStyle:
    | "rounded"
    | "square"
    | "pill"
    | "glass"
    | "neon"
    | "glitch"
    | "brutalist"
    | "minimal"
    | "liquid"
    | "cyberpunk";
  buttonColor: string;
  buttonTextColor: string;
  buttonTransparency: number;
  textColor: string;
  fontFamily: "sans" | "serif" | "mono";
  shopLogo?: string;
  shopHeaderType?: "text" | "image";
  shopHeaderText?: string;
  shopHeaderImage?: string;
  shopHeaderFontFamily?: "sans" | "serif" | "mono";
  shopHeaderFontSize?: "sm" | "base" | "lg" | "xl" | "2xl";
  shopHeaderFontWeight?: "normal" | "medium" | "bold" | "extrabold";
  shopBannerShowTitle?: boolean;
  shopBannerShowSubtitle?: boolean;
  shopBannerImage?: string;
  shopBannerTitle?: string;
  shopBannerSubtitle?: string;
  shopBannerPosition?: "inside" | "outside";
  shopCategories?: { id: string; name: string; image?: string }[];
  shopSocials?: { id: string; icon: string; url: string }[];
  shopThemeMode?: "dark" | "light";
}

export const defaultThemeConfig: ThemeConfig = {
  backgroundType: "gradient",
  backgroundColor: "#000000",
  backgroundGradientFrom: "#0f172a",
  backgroundGradientTo: "#3b0764",
  backgroundImage: "",
  layout: "classic",
  buttonStyle: "glass",
  buttonColor: "#ffffff",
  buttonTextColor: "#ffffff",
  buttonTransparency: 10,
  textColor: "#ffffff",
  fontFamily: "sans",
  shopHeaderType: "text",
  shopHeaderText: "Sua Marca",
  shopHeaderFontFamily: "sans",
  shopHeaderFontSize: "lg",
  shopHeaderFontWeight: "bold",
  shopBannerShowTitle: true,
  shopBannerShowSubtitle: true,
  shopBannerTitle: "Nova Coleção",
  shopBannerSubtitle: "Confira os destaques da semana",
  shopBannerPosition: "inside",
  shopCategories: [
    { id: "1", name: "Lançamentos" },
    { id: "2", name: "Promoções" },
    { id: "3", name: "Populares" },
  ],
  shopSocials: [],
  shopThemeMode: "dark",
};

export const shopExampleImages = [
  "https://placehold.co/1200x1200/0f172a/e2e8f0?text=Produto+1",
  "https://placehold.co/1200x1200/3b0764/f5f3ff?text=Produto+2",
  "https://placehold.co/1200x1200/111827/93c5fd?text=Produto+3",
];

export function buildShopExampleLinks(categoryNames: string[]): LinkItem[] {
  const safeCategoryNames = categoryNames.length ? categoryNames : ["Lançamentos", "Promoções", "Populares"];

  const items = [
    {
      title: "Coleção Verão 2025",
      price: "89,90",
      description: "Novidades exclusivas da estação",
      badgeLabel: "Lançamento",
      badgeColor: "#22c55e",
      category: safeCategoryNames[0] || "Lançamentos",
    },
    {
      title: "Kit Acessórios Premium",
      price: "129,90",
      description: "Combinação perfeita para seu estilo",
      badgeLabel: "Oferta",
      badgeColor: "#f97316",
      category: safeCategoryNames[1] || "Promoções",
    },
    {
      title: "Tênis Urbano",
      price: "249,90",
      description: "Conforto e design para o dia a dia",
      badgeLabel: "Popular",
      badgeColor: "#3b82f6",
      category: safeCategoryNames[2] || "Populares",
    },
  ];

  return items.map((item, index) => ({
    id: `example-${index}`,
    title: item.title,
    url: "https://",
    enabled: true,
    animation: "none",
    type: "product",
    price: item.price,
    description: item.description,
    image: shopExampleImages[index % shopExampleImages.length],
    category: item.category,
    currency: "R$",
    buttonLabel: "Comprar",
    badgeLabel: item.badgeLabel,
    badgeColor: item.badgeColor,
  }));
}

export function hexToRgba(hex: string, alpha: number) {
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function copyToClipboard(value: string) {
  if (!value) return;
  navigator.clipboard.writeText(value);
  toast.success("Copiado para a área de transferência!");
}

export function isValidDomain(value: string) {
  const domain = value.trim().toLowerCase();
  if (!domain) return false;
  const regex = /^(?!:\/\/)([a-z0-9-]+\.)+[a-z]{2,}$/;
  return regex.test(domain);
}

export function normalizeSlug(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/_+/g, "_");
  return normalized;
}

export function getPublicBioUrl(value: string) {
  const normalized = normalizeSlug(value);
  if (!normalized) return "";
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/bio/${normalized}`;
}

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function readStorageJson<T>(storage: StorageLike, key: string): T | null {
  return safeJsonParse<T>(storage.getItem(key));
}

export function writeStorageJson(storage: StorageLike, key: string, value: unknown) {
  storage.setItem(key, JSON.stringify(value));
}

export function buildLinkBioAddItemDraftKey(userId: string) {
  return `linkbio:add-item-draft:v1:${userId}`;
}

export function buildLinkBioUnsavedDraftKey(userId: string) {
  return `linkbio:unsaved-draft:v1:${userId}`;
}

export function canSubmitLinkBioAddItem(input: {
  isLoading: boolean;
  pageId: string | null;
  userId: string | null | undefined;
  isDirtyAfterBlur: boolean;
  isRevalidating: boolean;
  isSaving: boolean;
  isToolsEnabled: boolean;
}) {
  if (input.isLoading) return false;
  if (!input.pageId) return false;
  if (!input.userId) return false;
  if (!input.isToolsEnabled) return false;
  if (input.isDirtyAfterBlur) return false;
  if (input.isRevalidating) return false;
  if (input.isSaving) return false;
  return true;
}
