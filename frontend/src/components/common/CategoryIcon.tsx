import { createElement, type CSSProperties } from "react";
import { Package } from "lucide-react";
import { CATEGORY_ICONS } from "../../data/categoryIcons";

interface CategoryIconProps {
  name?: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Renders the icon registered for a category slug (falling back to a package).
 * The icon is resolved at render time with `createElement` so the component
 * identity is never re-created inside a parent component's render.
 */
export function CategoryIcon({ name, size = 16, className, style }: CategoryIconProps) {
  const Icon = (name && CATEGORY_ICONS[name]) || Package;
  return createElement(Icon, { size, className, style, "aria-hidden": true });
}
