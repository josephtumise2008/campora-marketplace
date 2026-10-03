// Public image assets live in `frontend/public/images`. Spaces are encoded so
// the same path string works in <img src>, CSS and fetch calls.
const imagePath = (relative) =>
  `/images/${relative.replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/")}`;

const CATEGORY_IMAGES = {
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

const HERO_IMAGES = {
  groceries: imagePath("Hero Images/campus-groceries.png"),
  food: imagePath("Hero Images/campus-food.png"),
  dorm: imagePath("Hero Images/campus-dorm.png"),
  shopping: imagePath("Hero Images/campus-shopping.png"),
  lifestyle: imagePath("Hero Images/campus-lifestyle.png"),
};

const STORE_ASSETS = {
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
    logo: imagePath("Stores/green-bowl/green-bowl-logo.jpg"),
    cover: imagePath("Stores/green-bowl/cover.png"),
  },
  "study-station": {
    logo: imagePath("Stores/study-station/study-station-logo.jpg"),
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

const AVATARS = Array.from({ length: 10 }, (_v, i) =>
  imagePath(`avatars/avatar-${String(i + 1).padStart(2, "0")}.jpg`)
);

const productImage = (folder, file) => imagePath(`product Images/${folder}/${file}`);

module.exports = {
  imagePath,
  CATEGORY_IMAGES,
  HERO_IMAGES,
  STORE_ASSETS,
  AVATARS,
  productImage,
};
