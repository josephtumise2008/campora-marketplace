export interface ProductFilters {
  q: string;
  category: string;
  store: string;
  university: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  inStock: string;
  deals: string;
  delivery: string;
  sort: string;
}

export const EMPTY_FILTERS: ProductFilters = {
  q: "",
  category: "",
  store: "",
  university: "",
  minPrice: "",
  maxPrice: "",
  minRating: "",
  inStock: "",
  deals: "",
  delivery: "",
  sort: "recommended",
};

