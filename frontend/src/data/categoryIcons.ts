import {
  Bike,
  BedDouble,
  Dumbbell,
  Gamepad2,
  Gift,
  Laptop,
  NotebookPen,
  Package,
  Shirt,
  ShoppingBasket,
  Sparkles,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  ShoppingBasket,
  UtensilsCrossed,
  Shirt,
  Laptop,
  NotebookPen,
  BedDouble,
  Sparkles,
  Dumbbell,
  Gamepad2,
  Gift,
  Bike,
  Wrench,
  Package,
};

export const CATEGORY_ACCENTS: Record<string, string> = {
  groceries: "#1A73E8",
  food: "#FF6B35",
  fashion: "#0F3460",
  electronics: "#1A73E8",
  school: "#0F3460",
  dorm: "#FF9F1C",
  beauty: "#FF6B35",
  fitness: "#1A73E8",
  gaming: "#0F3460",
  gifts: "#FF6B35",
  transportation: "#1A73E8",
  services: "#0F3460",
};

export const categoryIcon = (name?: string): LucideIcon =>
  (name && CATEGORY_ICONS[name]) || Package;
