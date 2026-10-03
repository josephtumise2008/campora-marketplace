/**
 * Frontend asset map. Paths mirror `backend/src/utils/images.js` — spaces are
 * encoded so the same string works in <img src>, CSS and fetch calls.
 *
 * Two seeded stores (Green Bowl, Study Station) ship without a logo file, so
 * `StoreLogo` falls back to initials when an image fails to load.
 */

const imagePath = (relative: string) =>
  `/images/${relative.replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/")}`;

export const CATEGORY_IMAGES: Record<string, string> = {
  groceries: imagePath("Category Images/groceries.png"),
  food: imagePath("Category Images/food.png"),
  fashion: imagePath("Category Images/fashion.png"),
  electronics: imagePath("Category Images/electronics.png"),
  school: imagePath("Category Images/school.png"),
  dorm: imagePath("Category Images/dorm.png"),
  beauty: imagePath("Category Images/beauty.png"),
  fitness: imagePath("Category Images/fitness.png"),
  gaming: imagePath("Category Images/gaming.png"),
  gifts: imagePath("Category Images/gifts.png"),
  transportation: imagePath("Category Images/transportation.png"),
  services: imagePath("Category Images/services.png"),
};

export const HERO_IMAGES = {
  shopping: imagePath("Hero Images/campus-shopping.png"),
  food: imagePath("Hero Images/campus-food.png"),
  groceries: imagePath("Hero Images/campus-groceries.png"),
  dorm: imagePath("Hero Images/campus-dorm.png"),
  lifestyle: imagePath("Hero Images/campus-lifestyle.png"),
} as const;

export const STORE_IMAGES: Record<string, { logo: string; cover: string }> = {
  "campus-grocery-co": {
    logo: imagePath("Stores/campus-grocery-co/campus-grocery-co-logo.jpg"),
    cover: imagePath("Stores/campus-grocery-co/cover.png"),
  },
  "campus-closet": {
    logo: imagePath("Stores/campus-closet/campus-closet-logo.jpg"),
    cover: imagePath("Stores/campus-closet/cover.png"),
  },
  bytetech: {
    logo: imagePath("Stores/bytetech/bytetech-logo.jpg"),
    cover: imagePath("Stores/bytetech/cover.png"),
  },
  "green-bowl": {
    logo: "",
    cover: imagePath("Stores/green-bowl/cover.png"),
  },
  "study-station": {
    logo: "",
    cover: imagePath("Stores/study-station/cover.png"),
  },
  dormify: {
    logo: imagePath("Stores/dormify/dormify-logo.jpg"),
    cover: imagePath("Stores/dormify/cover.png"),
  },
  fitfuel: {
    logo: imagePath("Stores/fitfuel/fitfuel-logo.jpg"),
    cover: imagePath("Stores/fitfuel/cover.png"),
  },
  "campus-creatives": {
    logo: imagePath("Stores/campus-creatives/campus-creatives-logo.jpg"),
    cover: imagePath("Stores/campus-creatives/cover.png"),
  },
};

/** Image library offered to sellers when listing a product. */
export const PRODUCT_IMAGE_LIBRARY: { category: string; images: string[] }[] = [
  {
    category: "groceries",
    images: [
      imagePath("product Images/Groceries/coffee.png"),
      imagePath("product Images/Groceries/fruit-box.png"),
      imagePath("product Images/Groceries/granola.png"),
      imagePath("product Images/Groceries/snacks.png"),
      imagePath("product Images/Groceries/water.png"),
    ],
  },
  {
    category: "food",
    images: [
      imagePath("product Images/Food & Drinks/burger.png"),
      imagePath("product Images/Food & Drinks/chicken-bowl.png"),
      imagePath("product Images/Food & Drinks/iced-coffee.png"),
      imagePath("product Images/Food & Drinks/pizza.png"),
    ],
  },
  {
    category: "fashion",
    images: [
      imagePath("product Images/Fashion/backpack.png"),
      imagePath("product Images/Fashion/campus-tshirts.png"),
      imagePath("product Images/Fashion/hoodie.png"),
      imagePath("product Images/Fashion/sneakers.png"),
    ],
  },
  {
    category: "electronics",
    images: [
      imagePath("product Images/Electronics/headphones.png"),
      imagePath("product Images/Electronics/keyboard.png"),
      imagePath("product Images/Electronics/power-bank.png"),
      imagePath("product Images/Electronics/usb-c-hub.png"),
      imagePath("product Images/Electronics/wireless-mouse.png"),
    ],
  },
  {
    category: "school",
    images: [
      imagePath("product Images/School/calculator.png"),
      imagePath("product Images/School/notebooks.png"),
      imagePath("product Images/School/stationery-set.png"),
    ],
  },
  {
    category: "dorm",
    images: [
      imagePath("product Images/Dorm/bedsheet.png"),
      imagePath("product Images/Dorm/desk-lamp.png"),
      imagePath("product Images/Dorm/mini-fan.png"),
      imagePath("product Images/Dorm/storage-box.png"),
    ],
  },
  {
    category: "beauty",
    images: [
      imagePath("product Images/Beauty/body-care.png"),
      imagePath("product Images/Beauty/hair-care.png"),
      imagePath("product Images/Beauty/skincare-set.png"),
    ],
  },
  {
    category: "fitness",
    images: [
      imagePath("product Images/Fitness/dumbbells.png"),
      imagePath("product Images/Fitness/water-bottles.png"),
      imagePath("product Images/Fitness/yoga-mat.png"),
    ],
  },
  {
    category: "gaming",
    images: [
      imagePath("product Images/Gaming/gaming-controller.png"),
      imagePath("product Images/Gaming/gaming-headset.png"),
    ],
  },
  {
    category: "gifts",
    images: [
      imagePath("product Images/Gifts/campus-mug.png"),
      imagePath("product Images/Gifts/gift-box.png"),
    ],
  },
];

export const AVATARS = Array.from(
  { length: 10 },
  (_value, index) => imagePath(`avatars/avatar-${String(index + 1).padStart(2, "0")}.jpg`)
);

export const FALLBACK_PRODUCT_IMAGE = CATEGORY_IMAGES.groceries;

/** Suggest a catalog image for a newly created product based on its category. */
export const suggestProductImages = (categorySlug: string, count = 2) => {
  const group =
    PRODUCT_IMAGE_LIBRARY.find((entry) => entry.category === categorySlug) ||
    PRODUCT_IMAGE_LIBRARY[0];
  return group.images.slice(0, Math.max(1, count));
};
