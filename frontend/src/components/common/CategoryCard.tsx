import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { Category } from "../../types";
import { cx, numberCompact } from "../../utils/format";
import { CategoryIcon } from "./CategoryIcon";
import { SmartImage } from "../ui/SmartImage";

interface CategoryCardProps {
  category: Category;
  index?: number;
  compact?: boolean;
}

export function CategoryCard({ category, index = 0, compact = false }: CategoryCardProps) {
  return (
    <motion.div
      className={cx("category-card", compact && "category-card--compact")}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.28), ease: [0.16, 1, 0.3, 1] }}
      style={{ ["--tile-accent" as string]: category.accent || "var(--brand-500)" }}
    >
      <Link to={`/category/${category.slug}`} className="category-card__link">
        <span className="category-card__media">
          <SmartImage src={category.image} alt={category.name} ratio="square" fallbackLabel={category.name} />
          <span className="category-card__icon" aria-hidden="true">
            <CategoryIcon name={category.icon || category.name} size={16} />
          </span>
        </span>
        <span className="category-card__body">
          <span className="category-card__name">{category.name}</span>
          <span className="category-card__tagline">{category.tagline}</span>
          {typeof category.productCount === "number" ? (
            <span className="category-card__count">{numberCompact(category.productCount)} products</span>
          ) : null}
        </span>
      </Link>
    </motion.div>
  );
}

export function CategoryStrip({ categories }: { categories: Category[] }) {
  return (
    <div className="category-strip">
      {categories.map((category) => {
        return (
          <Link
            key={category._id}
            to={`/category/${category.slug}`}
            className="category-chip"
            style={{ ["--tile-accent" as string]: category.accent || "var(--brand-500)" }}
          >
            <CategoryIcon name={category.icon || category.name} size={15} />
            {category.name}
          </Link>
        );
      })}
    </div>
  );
}

export function CategoryTiles({ categories }: { categories: Category[] }) {
  return (
    <div className="category-tiles">
      {categories.map((category, index) => (
        <CategoryCard key={category._id} category={category} index={index} />
      ))}
    </div>
  );
}

export function ViewAllLink({ to, label = "View all" }: { to: string; label?: string }) {
  return (
    <Link to={to} className="link-arrow">
      {label}
      <ArrowRight size={15} aria-hidden="true" />
    </Link>
  );
}
