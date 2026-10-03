const {
  CATEGORY_IMAGES,
  HERO_IMAGES,
  STORE_ASSETS,
  AVATARS,
  productImage,
} = require("../utils/images");

/* ------------------------------------------------------------------ *
 * Categories
 * ------------------------------------------------------------------ */

const CATEGORIES = [
  {
    name: "Groceries",
    slug: "groceries",
    tagline: "Pantry staples, snacks and fresh picks",
    description:
      "Everything you forget to buy before move-in day. Campus Grocery Co. keeps your pantry, fridge and 2 a.m. study-break drawer stocked with same-day delivery.",
    image: CATEGORY_IMAGES.groceries,
    icon: "ShoppingBasket",
    accent: "#1A73E8",
    order: 1,
    featured: true,
  },
  {
    name: "Food & Drinks",
    slug: "food",
    tagline: "Bowls, bakes, coffee and late-night bites",
    description:
      "Fresh bowls, stone-fired pizza, cold brew and midnight delivery from the kitchens closest to campus.",
    image: CATEGORY_IMAGES.food,
    icon: "UtensilsCrossed",
    accent: "#FF6B35",
    order: 2,
    featured: true,
  },
  {
    name: "Fashion",
    slug: "fashion",
    tagline: "Campus-ready apparel, shoes and bags",
    description:
      "Layered staples, oversized hoodies, sneakers and the bags that survive a full semester of commuting.",
    image: CATEGORY_IMAGES.fashion,
    icon: "Shirt",
    accent: "#0F3460",
    order: 3,
    featured: true,
  },
  {
    name: "Electronics",
    slug: "electronics",
    tagline: "Audio, chargers, desk gear and more",
    description:
      "Headphones that survive library hours, chargers that survive a full day of classes, and desk setups that make finals week survivable.",
    image: CATEGORY_IMAGES.electronics,
    icon: "Laptop",
    accent: "#1A73E8",
    order: 4,
    featured: true,
  },
  {
    name: "School Supplies",
    slug: "school",
    tagline: "Notebooks, calculators and print credits",
    description:
      "Notebooks, writing tools, graphing calculators and print credits for the paper deadlines nobody warned you about.",
    image: CATEGORY_IMAGES.school,
    icon: "NotebookPen",
    accent: "#0F3460",
    order: 5,
    featured: true,
  },
  {
    name: "Dorm & Home",
    slug: "dorm",
    tagline: "Bedding, storage, lighting and small spaces",
    description:
      "Turn a 120-square-foot room into a place you actually want to sleep in. Bedding, storage, lighting and airflow for small spaces.",
    image: CATEGORY_IMAGES.dorm,
    icon: "BedDouble",
    accent: "#FF9F1C",
    order: 6,
    featured: true,
  },
  {
    name: "Beauty & Personal Care",
    slug: "beauty",
    tagline: "Skincare, haircare and self-care",
    description:
      "Routines that survive a packed schedule, from daily cleansing sets to overnight repair masks.",
    image: CATEGORY_IMAGES.beauty,
    icon: "Sparkles",
    accent: "#FF6B35",
    order: 7,
    featured: true,
  },
  {
    name: "Fitness",
    slug: "fitness",
    tagline: "Gear, recovery and rec-center access",
    description:
      "Mat, lift, hydrate, recover. Training gear and rec-center access for athletes and 6 a.m. class-goers.",
    image: CATEGORY_IMAGES.fitness,
    icon: "Dumbbell",
    accent: "#1A73E8",
    order: 8,
    featured: true,
  },
  {
    name: "Gaming",
    slug: "gaming",
    tagline: "Controllers, headsets and setups",
    description:
      "Low-latency headsets, spare controllers and desk setups built for late-night ranked sessions.",
    image: CATEGORY_IMAGES.gaming,
    icon: "Gamepad2",
    accent: "#0F3460",
    order: 9,
    featured: true,
  },
  {
    name: "Gifts",
    slug: "gifts",
    tagline: "Custom prints, mugs and care packages",
    description:
      "Custom-printed totes, engraved mugs, graduation care packages and finals-week survival boxes.",
    image: CATEGORY_IMAGES.gifts,
    icon: "Gift",
    accent: "#FF6B35",
    order: 10,
    featured: true,
  },
  {
    name: "Transportation",
    slug: "transportation",
    tagline: "Bikes, scooters, parking and shuttles",
    description:
      "Tune-ups, safety gear, parking validation and shuttle seats for getting around campus without a car.",
    image: CATEGORY_IMAGES.transportation,
    icon: "Bike",
    accent: "#1A73E8",
    order: 11,
    featured: false,
  },
  {
    name: "Student Services",
    slug: "services",
    tagline: "Tutoring, printing, resumes and creative work",
    description:
      "Peer tutoring, résumé reviews, print runs and creative services from student freelancers and campus partners.",
    image: CATEGORY_IMAGES.services,
    icon: "Wrench",
    accent: "#0F3460",
    order: 12,
    featured: true,
  },
];

/* ------------------------------------------------------------------ *
 * Stores
 * ------------------------------------------------------------------ */

const STANDARD_HOURS = [
  { day: "Mon", open: "8:00 AM", close: "10:00 PM" },
  { day: "Tue", open: "8:00 AM", close: "10:00 PM" },
  { day: "Wed", open: "8:00 AM", close: "10:00 PM" },
  { day: "Thu", open: "8:00 AM", close: "11:00 PM" },
  { day: "Fri", open: "8:00 AM", close: "11:00 PM" },
  { day: "Sat", open: "9:00 AM", close: "11:00 PM" },
  { day: "Sun", open: "9:00 AM", close: "9:00 PM" },
];

const STORES = [
  {
    name: "Campus Grocery Co.",
    slug: "campus-grocery-co",
    tagline: "Groceries, snacks and drinks delivered across campus",
    description:
      "Campus Grocery Co. started in a shared apartment kitchen with a single goal: make the walk to the store optional. Today our student-run crew picks, packs and delivers pantry staples, fresh produce, cold brew and study-break snacks to every residence hall and off-campus block in the area. We source from local grocers and campus vendors, and we deliver in under an hour on most days.",
    category: "groceries",
    categories: ["groceries", "food"],
    verification: "verified",
    featured: true,
    rating: { average: 4.8, count: 1284 },
    location: {
      city: "Los Angeles",
      state: "CA",
      address: "412 Royce Hall Row, Westwood",
      zip: "90024",
      universities: ["ucla", "usc"],
    },
    delivery: {
      fee: 1.99,
      freeThreshold: 35,
      etaMinutes: 30,
      methods: ["Delivery", "Pickup"],
      minimumOrder: 5,
    },
    contact: { email: "hello@campus-grocery.co", phone: "(310) 555-0142" },
    hours: STANDARD_HOURS,
    policies: {
      returns:
        "Perishable items are non-returnable. For damaged or incorrect items, contact us within 24 hours of delivery and we will credit the full amount.",
      delivery:
        "Same-day delivery is available daily from 8:00 AM to 10:00 PM within a 3-mile campus radius. Live arrival estimates appear at checkout.",
      substitutions:
        "If an item is unavailable, our pickers will choose the closest in-brand alternative at the same or lower price. You are never charged the difference.",
    },
    promo: {
      headline: "Free delivery on orders over $35",
      code: "CAMPORA10",
      discountPercent: 10,
    },
  },
  {
    name: "The Campus Closet",
    slug: "campus-closet",
    tagline: "Apparel, sneakers and personal care for the semester",
    description:
      "The Campus Closet is a student-run boutique stocking the pieces that actually get worn between lectures: heavyweight hoodies, layered tees, sneakers that survive a full walking day, and a small but carefully chosen personal care shelf. We buy in small batches, so sizes sell out fast and new colourways land every few weeks.",
    category: "fashion",
    categories: ["fashion", "beauty"],
    verification: "verified",
    featured: true,
    rating: { average: 4.6, count: 864 },
    location: {
      city: "Los Angeles",
      state: "CA",
      address: "1081 Gayley Avenue, Westwood",
      zip: "90024",
      universities: ["ucla", "usc"],
    },
    delivery: {
      fee: 2.99,
      freeThreshold: 45,
      etaMinutes: 45,
      methods: ["Delivery", "Pickup"],
      minimumOrder: 0,
    },
    contact: { email: "shop@thecampuscloset.com", phone: "(310) 555-0188" },
    hours: STANDARD_HOURS,
    policies: {
      returns:
        "Unworn items with tags attached can be returned within 21 days for a full refund. Sale items are final sale.",
      delivery:
        "Standard campus delivery arrives in 45-90 minutes. Free delivery applies to orders over $45.",
      substitutions:
        "Apparel orders ship in the size selected. If a size is sold out, we contact you with options before proceeding.",
    },
    promo: {
      headline: "New season drop: 20% off hoodies",
      code: "CLOSET20",
      discountPercent: 20,
    },
  },
  {
    name: "ByteTech",
    slug: "bytetech",
    tagline: "Audio, desk gear and gaming setups, tested and ready",
    description:
      "ByteTech is run by computer science majors who got tired of buying gear online and returning it. Every audio, charging and desk product we sell is set up, stress-tested and returned by the team before it ships. We also offer free setup guidance on every order over $40, because a great keyboard is useless if you cannot remap it.",
    category: "electronics",
    categories: ["electronics", "gaming"],
    verification: "verified",
    featured: true,
    rating: { average: 4.7, count: 1520 },
    location: {
      city: "Los Angeles",
      state: "CA",
      address: "900 Exposition Boulevard, Westwood",
      zip: "90024",
      universities: ["ucla", "usc"],
    },
    delivery: {
      fee: 0,
      freeThreshold: 50,
      etaMinutes: 35,
      methods: ["Delivery", "Pickup"],
      minimumOrder: 0,
    },
    contact: { email: "support@bytetech.shop", phone: "(310) 555-0164" },
    hours: STANDARD_HOURS,
    policies: {
      returns:
        "30-day returns on electronics in original packaging. Defective items are replaced, not repaired, at no cost.",
      delivery:
        "Free campus delivery on orders over $50. Same-day pickup is available at our Westwood counter.",
      substitutions:
        "We will not substitute electronic products. If your item is unavailable you receive an instant refund or credit.",
    },
    promo: {
      headline: "Student discount: 10% off with .edu email",
      code: "BYTECH10",
      discountPercent: 10,
    },
  },
  {
    name: "Green Bowl",
    slug: "green-bowl",
    tagline: "Grain bowls, stone-fired pizza and cold brew",
    description:
      "Green Bowl is the kitchen between the library and the quad. We build grain bowls to order, fire pizzas on a 90-second cycle, and pull nitrogen cold brew that actually tastes like coffee. Order ahead for pickup or have it delivered hot to your building lobby in about 25 minutes.",
    category: "food",
    categories: ["food", "groceries"],
    verification: "verified",
    featured: true,
    rating: { average: 4.9, count: 2310 },
    location: {
      city: "Austin",
      state: "TX",
      address: "2210 Guadalupe Street, Austin",
      zip: "78705",
      universities: ["utexas"],
    },
    delivery: {
      fee: 2.49,
      freeThreshold: 30,
      etaMinutes: 25,
      methods: ["Delivery", "Pickup"],
      minimumOrder: 8,
    },
    contact: { email: "eat@greenbowl.co", phone: "(512) 555-0119" },
    hours: STANDARD_HOURS,
    policies: {
      returns:
        "Food is prepared to order, so we cannot resell it. If an order is wrong or incomplete, contact us within 30 minutes for a full credit.",
      delivery:
        "Hot delivery to campus buildings in 25-40 minutes. Pickup windows are 15 minutes and orders are held fresh for 20 minutes.",
      substitutions:
        "Protein and grain swaps are free. Allergen substitutions are available on request at checkout.",
    },
    promo: {
      headline: "Meal passes save up to 16%",
      code: "GREENBOWL",
      discountPercent: 15,
    },
  },
  {
    name: "Study Station",
    slug: "study-station",
    tagline: "Supplies, printing and peer tutoring",
    description:
      "Study Station is a print lab, supply counter and tutoring desk rolled into one. Order notebooks, writing tools and graphing calculators for campus pickup, add print credits, or book time with an upperclassman tutor for calculus, organic chemistry, statistics and writing.",
    category: "school",
    categories: ["school", "services"],
    verification: "verified",
    featured: false,
    rating: { average: 4.5, count: 612 },
    location: {
      city: "Ann Arbor",
      state: "MI",
      address: "3115 South State Street, Ann Arbor",
      zip: "48104",
      universities: ["umich"],
    },
    delivery: {
      fee: 1.49,
      freeThreshold: 40,
      etaMinutes: 20,
      methods: ["Pickup", "Delivery"],
      minimumOrder: 0,
    },
    contact: { email: "help@studystation.campus", phone: "(734) 555-0157" },
    hours: STANDARD_HOURS,
    policies: {
      returns:
        "Unopened supplies can be returned within 14 days with a receipt. Tutoring sessions can be rescheduled free of charge up to 12 hours before the start time.",
      delivery:
        "Supply orders are available for campus pickup within 20 minutes, or delivery to residence halls for a flat fee.",
      substitutions:
        "Print and supply orders are fulfilled exactly as submitted. If stock runs out we contact you within one business hour.",
    },
    promo: {
      headline: "Tutor your first subject, get the second free",
      code: "STUDYFIRST",
      discountPercent: 50,
    },
  },
  {
    name: "Dormify",
    slug: "dormify",
    tagline: "Bedding, storage and small-space upgrades",
    description:
      "Dormify makes small rooms work better. Twin XL bedding that actually fits, under-bed storage, quiet fans, proper desk lighting and the organisation systems that keep a shared room from turning into a laundry pile. Measured for standard residence hall dimensions so nothing arrives and stays in the box.",
    category: "dorm",
    categories: ["dorm"],
    verification: "verified",
    featured: true,
    rating: { average: 4.7, count: 978 },
    location: {
      city: "New York",
      state: "NY",
      address: "44 West 12th Street, New York",
      zip: "10011",
      universities: ["nyu"],
    },
    delivery: {
      fee: 3.99,
      freeThreshold: 45,
      etaMinutes: 50,
      methods: ["Delivery", "Pickup"],
      minimumOrder: 15,
    },
    contact: { email: "help@dormify.co", phone: "(212) 555-0173" },
    hours: STANDARD_HOURS,
    policies: {
      returns:
        "Bedding and home goods can be returned within 30 days, unwashed and in original packaging. Mattress toppers must be unopened.",
      delivery:
        "Residence hall delivery is scheduled in two-hour windows so you are not waiting in the lobby. Free delivery over $45.",
      substitutions:
        "Colour and size substitutions require your approval before the order is packed.",
    },
    promo: {
      headline: "Move-in bundles save up to 18%",
      code: "DORMIFY",
      discountPercent: 15,
    },
  },
  {
    name: "FitFuel",
    slug: "fitfuel",
    tagline: "Training gear, recovery and rec-center access",
    description:
      "FitFuel carries the equipment we actually use: mats that grip, bottles that fit a bike cage, and adjustable dumbbells that replace a rack nobody in a studio apartment can hold. Order in the morning, pick up before your afternoon lift, and grab a day pass on the way out.",
    category: "fitness",
    categories: ["fitness", "groceries"],
    verification: "verified",
    featured: false,
    rating: { average: 4.6, count: 1450 },
    location: {
      city: "Seattle",
      state: "WA",
      address: "4736 Brooklyn Avenue NE, Seattle",
      zip: "98105",
      universities: ["uw"],
    },
    delivery: {
      fee: 1.99,
      freeThreshold: 40,
      etaMinutes: 30,
      methods: ["Delivery", "Pickup"],
      minimumOrder: 0,
    },
    contact: { email: "team@fitfuel.fit", phone: "(206) 555-0126" },
    hours: STANDARD_HOURS,
    policies: {
      returns:
        "Unused fitness gear can be returned within 30 days. Personal hygiene items cannot be returned once opened.",
      delivery:
        "Same-day delivery across campus, with a two-hour window on heavy items like dumbbells.",
      substitutions:
        "Sizing swaps for mats and straps are free. We will suggest an alternative weight range if your exact set is unavailable.",
    },
    promo: {
      headline: "Rec-center day passes: buy 5, get 1 free",
      code: "FITFUEL5",
      discountPercent: 0,
    },
  },
  {
    name: "Campus Creatives",
    slug: "campus-creatives",
    tagline: "Custom prints, mugs and finals-week care packages",
    description:
      "Campus Creatives is a student print studio and gift shop. We handle custom totes, engraved mugs, poster runs, business cards and the graduation care packages that arrive looking suspiciously organised. Same-day turnaround is available on most items when you order before 2 p.m. Finished print runs ship to every Campora campus, and our Gainesville counter handles local pickup.",
    category: "gifts",
    categories: ["gifts", "services"],
    verification: "verified",
    featured: false,
    rating: { average: 4.9, count: 742 },
    location: {
      city: "Gainesville",
      state: "FL",
      address: "1630 University Boulevard, Gainesville",
      zip: "32603",
      universities: ["ufl", "ucla", "usc", "utexas", "umich", "nyu", "uw", "osu"],
    },
    delivery: {
      fee: 0,
      freeThreshold: 0,
      etaMinutes: 40,
      methods: ["Delivery", "Pickup"],
      minimumOrder: 0,
    },
    contact: { email: "make@campuscreatives.co", phone: "(352) 555-0195" },
    hours: STANDARD_HOURS,
    policies: {
      returns:
        "Custom and personalised items are final sale unless they arrive damaged or incorrect. Blank products follow a 14-day return window.",
      delivery:
        "Free campus delivery on all orders. Custom print runs ship within two business days of artwork approval.",
      substitutions:
        "Artwork proofs are sent for approval before printing. We will not print without your confirmation.",
    },
    promo: {
      headline: "Free campus delivery on every order",
      code: "CREATIVE15",
      discountPercent: 15,
    },
  },
  {
    name: "Sunset Snack Bar",
    slug: "sunset-snack-bar",
    tagline: "Late-night quesadillas and iced coffee near the buses",
    description:
      "Sunset Snack Bar is a late-night counter two blocks from the east bus stop. Application submitted for Campora verification; awaiting review.",
    category: "food",
    categories: ["food"],
    verification: "pending",
    featured: false,
    status: "paused",
    rating: { average: 0, count: 0 },
    location: {
      city: "Gainesville",
      state: "FL",
      address: "402 SE University Avenue, Gainesville",
      zip: "32601",
      universities: ["ufl"],
    },
    delivery: { fee: 1.5, freeThreshold: 25, etaMinutes: 25, methods: ["Pickup"] },
    contact: { email: "apply@sunsetsnackbar.example", phone: "(352) 555-0101" },
    hours: STANDARD_HOURS,
    policies: {
      returns: "Contact the counter within 24 hours for order issues.",
      delivery: "Pickup only while the application is under review.",
      substitutions: "Standard in-store substitutions apply.",
    },
    promo: { headline: "", code: "", discountPercent: 0 },
    isApplication: true,
  },
];

/* ------------------------------------------------------------------ *
 * Product catalog
 * ------------------------------------------------------------------ */

const SPEC_PRESETS = {
  groceries: [
    { label: "Shipping weight", value: "1-3 lb" },
    { label: "Storage", value: "Shelf stable" },
  ],
  food: [
    { label: "Preparation", value: "Made to order" },
    { label: "Allergens", value: "Ask at checkout" },
  ],
  fashion: [{ label: "Care", value: "Machine wash cold" }, { label: "Origin", value: "Imported" }],
  electronics: [{ label: "Warranty", value: "12 months" }, { label: "Power", value: "USB-C" }],
  school: [{ label: "Paper", value: "100 gsm" }],
  dorm: [{ label: "Fit", value: "Twin XL (38 x 80 in)" }],
  beauty: [{ label: "Skin type", value: "All skin types" }],
  fitness: [{ label: "Use", value: "Indoor and outdoor" }],
  gaming: [{ label: "Platform", value: "PC, Mac, console" }],
  gifts: [{ label: "Turnaround", value: "Same day before 2 PM" }],
  transportation: [{ label: "Coverage", value: "Campus-wide" }],
  services: [{ label: "Format", value: "On campus or remote" }],
};

const RAW_PRODUCTS = [
  /* ---------------- Campus Grocery Co. ---------------- */
  ["Campus Snack Box Variety Pack", "campus-grocery-co", "groceries", 18.99, 24.99, productImage("Groceries", "snacks.png"), 64, 4.8, 214, "12 bars, 4 flavours", "A semester's worth of study-break fuel in one box: 12 snack bars across four flavours, packed the morning they ship so nothing sits in a warehouse.", "bestseller"],
  ["Cold Brew Coffee Concentrate, 6-Pack", "campus-grocery-co", "groceries", 14.5, 19.0, productImage("Groceries", "coffee.png"), 88, 4.7, 176, "6 x 32 oz", "Slow-steeped for 18 hours with no bitterness. Mix one concentrate with water or milk for a full litre, or drink it straight over ice.", "bestseller"],
  ["Sparkling Water, 12-Pack", "campus-grocery-co", "groceries", 7.49, 9.99, productImage("Groceries", "water.png"), 120, 4.5, 143, "12 x 12 oz cans", "Lightly carbonated spring water with real citrus extract. No sugar, no sodium, and it survives a warm lecture hall.", ""],
  ["Stone-Baked Granola Variety, 4 Bags", "campus-grocery-co", "groceries", 12.75, 0, productImage("Groceries", "granola.png"), 96, 4.6, 121, "4 x 12 oz bags", "Four small-batch flavours baked in Northern California: maple pecan, dark cocoa, almond butter and plain oat. Big clusters, no palm oil.", ""],
  ["Weekly Fruit & Veggie Box", "campus-grocery-co", "groceries", 24.5, 29.0, productImage("Groceries", "fruit-box.png"), 42, 4.7, 208, "Serves 1-2, 6-8 items", "Six to eight seasonal items sourced from a farm 40 minutes north. Order by 9 p.m. for delivery the next morning.", "deal"],
  ["Pantry Restock Kit", "campus-grocery-co", "groceries", 32.0, 38.0, CATEGORY_IMAGES.groceries, 38, 4.5, 96, "18 essentials", "Everything a shared apartment forgets to replace: pasta, sauce, rice, canned beans, tortillas, oil and the coffee you pretend you have.", ""],
  ["Organic Oat Milk, 6-Pack", "campus-grocery-co", "groceries", 9.99, 0, CATEGORY_IMAGES.groceries, 150, 4.4, 88, "6 x 32 oz cartons", "Barista-grade oat milk that does not separate in a travel mug. Good in cereal, coffee and the freezer.", ""],
  ["Single-Origin Pour-Over Sampler", "campus-grocery-co", "groceries", 16.8, 0, productImage("Groceries", "coffee.png"), 54, 4.8, 74, "4 x 8 oz bags", "Four rotating single-origin beans roasted in small batches: Ethiopia natural, Colombia washed, Guatemala medium and a seasonal blend.", "deal"],
  ["Late-Night Ramen & Boba Bundle", "campus-grocery-co", "groceries", 21.4, 26.0, productImage("Groceries", "snacks.png"), 47, 4.6, 132, "Serves 2", "Six packets of top-tier ramen, two tapioca boba kits and the chili crisp that makes instant food intentional.", ""],
  ["Hydration Water, 24-Pack", "campus-grocery-co", "groceries", 11.99, 14.99, productImage("Groceries", "water.png"), 200, 4.3, 64, "24 x 16.9 oz", "Spring water in a slim bottle that fits a backpack pocket or a bike cage. Cheaper per bottle by the case.", ""],
  ["Study Break Snack Bundle", "campus-grocery-co", "groceries", 15.75, 19.5, productImage("Groceries", "snacks.png"), 72, 4.5, 101, "Serves 4", "Trail mix, dried fruit, pretzels and dark chocolate assembled for a 4-person library session that runs past dinner.", ""],
  ["Cold Brew + Tumbler Set", "campus-grocery-co", "groceries", 22.0, 27.0, productImage("Groceries", "coffee.png"), 58, 4.7, 79, "1 concentrate + 1 tumbler", "Two cold brew concentrates and a 16 oz insulated tumbler with a leak-resistant lid. The most efficient purchase on this page.", "deal"],

  /* ---------------- Green Bowl ---------------- */
  ["Green Bowl Harvest Chicken Bowl", "green-bowl", "food", 13.95, 15.95, productImage("Food & Drinks", "chicken-bowl.png"), 180, 4.9, 412, "Serves 1", "Grilled chicken, farro, roasted squash, kale and a lemon tahini drizzle assembled in under three minutes.", "bestseller"],
  ["Double Smash Burger Meal", "green-bowl", "food", 14.5, 0, productImage("Food & Drinks", "burger.png"), 140, 4.8, 356, "Burger + fries + drink", "Two smashed patties, aged cheddar, house pickles and a brioche bun. Comes with salted fries and a fountain drink.", ""],
  ["Stone-Fired Margherita Pizza", "green-bowl", "food", 16.0, 19.0, productImage("Food & Drinks", "pizza.png"), 90, 4.8, 301, "12 inch", "San Marzano tomato, fior di latte and basil, fired at 800 degrees for 90 seconds. Ready in about 8 minutes.", "bestseller"],
  ["Nitrogen Cold Brew, 16 oz", "green-bowl", "food", 5.25, 5.75, productImage("Food & Drinks", "iced-coffee.png"), 300, 4.7, 528, "16 oz", "Cold brew infused with nitrogen for a cascading pour and zero bitterness. Oat, almond or whole milk.", ""],
  ["Tofu Crunch Bowl", "green-bowl", "food", 12.75, 0, productImage("Food & Drinks", "chicken-bowl.png"), 160, 4.6, 187, "Serves 1", "Crispy glazed tofu, brown rice, cucumber, edamame and sesame ginger dressing. Vegan as served.", ""],
  ["Student Lunch Pass, 5 Meals", "green-bowl", "food", 54.0, 64.0, CATEGORY_IMAGES.food, 70, 4.9, 214, "5 bowls, valid 8 weeks", "Five build-your-own bowls at a fixed price. Skip a week and it rolls over once before the pass expires.", "deal"],
  ["Matcha Oat Latte", "green-bowl", "food", 6.5, 0, productImage("Food & Drinks", "iced-coffee.png"), 220, 4.7, 243, "16 oz", "Ceremonial-grade matcha shaken with oat milk and a touch of maple. Half-sweet by default, adjustable.", ""],
  ["Sweet Potato Fries + Shake Combo", "green-bowl", "food", 11.95, 13.5, CATEGORY_IMAGES.food, 130, 4.5, 168, "Serves 1", "Crispy sweet potato fries with sea salt and a thick vanilla shake. A study-session reward that fits in one hand.", ""],
  ["Teriyaki Salmon Rice Bowl", "green-bowl", "food", 15.75, 17.5, productImage("Food & Drinks", "chicken-bowl.png"), 110, 4.8, 226, "Serves 1", "Glazed salmon over brown rice with broccolini, pickled carrot and sesame. Ready in 4 minutes.", ""],
  ["Family Pizza Night Bundle", "green-bowl", "food", 28.0, 34.0, productImage("Food & Drinks", "pizza.png"), 60, 4.7, 97, "2 pizzas + 1 litre soda", "Two 14 inch pies in any two styles plus a litre of fountain drink. Add a side of garlic knots for four dollars.", "deal"],

  /* ---------------- The Campus Closet ---------------- */
  ["Campus Crew Graphic Tee", "campus-closet", "fashion", 18.0, 24.0, productImage("Fashion", "campus-tshirts.png"), 220, 4.6, 389, "Unisex, S-2XL", "A mid-weight 6.1 oz cotton tee with a soft-hand screen print that survives 40+ washes. Cut a little boxy so it layers well.", "bestseller"],
  ["Fleece-Lined Campus Hoodie", "campus-closet", "fashion", 42.0, 58.0, productImage("Fashion", "hoodie.png"), 96, 4.8, 274, "Unisex, S-2XL", "380 gsm brushed-back fleece with a double-lined hood, ribbed cuffs and a pocket deep enough for a phone and a card.", "bestseller"],
  ["All-Day Student Backpack", "campus-closet", "fashion", 54.99, 69.0, productImage("Fashion", "backpack.png"), 74, 4.7, 231, "24 L", "Water-resistant recycled shell, padded 16 inch laptop sleeve, and a front pocket sized for a water bottle and a lab notebook.", ""],
  ["Court Sneakers", "campus-closet", "fashion", 64.0, 89.0, productImage("Fashion", "sneakers.png"), 58, 4.5, 158, "Runs true to size", "Low-top canvas-and-suede court sneaker with a cushioned insole and a stitched rubber outsole. Wears well for classes and the walk home.", ""],
  ["Three-Pack Basic Tees", "campus-closet", "fashion", 27.0, 33.0, productImage("Fashion", "campus-tshirts.png"), 140, 4.4, 197, "3 pack, S-2XL", "Three heavyweight everyday tees in white, heather grey and black. Buy once and stop thinking about it.", ""],
  ["Varsity Zip Jacket", "campus-closet", "fashion", 76.0, 98.0, productImage("Fashion", "hoodie.png"), 36, 4.7, 84, "Unisex, S-2XL", "A mid-weight varsity jacket with snap cuffs, contrast lining and a collar that stays flat after a hundred washes.", "deal"],
  ["Canvas Tote + Card Holder Set", "campus-closet", "fashion", 29.0, 36.0, CATEGORY_IMAGES.fashion, 82, 4.4, 112, "Set of 2", "A 12 oz canvas tote with an interior pocket for a 15 inch laptop, plus a slim card holder in matching material.", ""],
  ["Everyday Socks, 5-Pack", "campus-closet", "fashion", 14.0, 0, CATEGORY_IMAGES.fashion, 190, 4.3, 176, "5 pairs, S-XL", "Combed cotton crew socks with a reinforced heel and a cuff that stays up through a full lecture day.", ""],
  ["Relaxed Straight-Leg Denim", "campus-closet", "fashion", 58.0, 72.0, CATEGORY_IMAGES.fashion, 64, 4.6, 121, "W-28 to W-36", "A relaxed straight leg with a mid rise, made from 99% cotton with a hint of stretch so it works for sitting through a lecture.", ""],

  /* ---------------- ByteTech ---------------- */
  ["Wireless Over-Ear Headphones", "bytetech", "electronics", 89.99, 129.99, productImage("Electronics", "headphones.png"), 110, 4.7, 421, "40 h battery", "Active noise cancellation, 40 hours of playback and multipoint Bluetooth so your laptop and phone connect at the same time.", "bestseller"],
  ["Mechanical Keyboard, Hot-Swap", "bytetech", "electronics", 74.5, 99.0, productImage("Electronics", "keyboard.png"), 88, 4.8, 318, "75% layout", "A hot-swappable 75% mechanical board with pre-lubed switches, PBT double-shot keycaps and a gasket-mounted plate. Remap every key in the browser.", "bestseller"],
  ["20,000 mAh Power Bank", "bytetech", "electronics", 34.99, 44.99, productImage("Electronics", "power-bank.png"), 165, 4.7, 396, "65 W USB-C PD", "Enough capacity for three full phone charges, with 65 W passthrough charging that tops up a laptop from the same brick.", "deal"],
  ["7-in-1 USB-C Hub", "bytetech", "electronics", 39.95, 49.95, productImage("Electronics", "usb-c-hub.png"), 140, 4.6, 267, "1 HDMI, 3 USB-A", "One cable to your monitor, keyboard, mouse and flash drive. 4K60 HDMI output and pass-through charging in a 4 inch body.", ""],
  ["Ergonomic Wireless Mouse", "bytetech", "electronics", 28.5, 34.0, productImage("Electronics", "wireless-mouse.png"), 200, 4.5, 189, "6 month battery", "A low-latency 2.4 GHz mouse with an angled grip, silent clicks and a sensor that tracks accurately on a dorm desk.", ""],
  ["Programmable Gaming Controller", "bytetech", "gaming", 59.99, 69.99, productImage("Gaming", "gaming-controller.png"), 130, 4.6, 288, "PC, Mac, console", "Four remappable back buttons, hair-trigger stops, swappable stick heights and a braided cable that will not fray.", "bestseller"],
  ["Low-Latency Gaming Headset", "bytetech", "gaming", 84.0, 109.0, productImage("Gaming", "gaming-headset.png"), 98, 4.7, 305, "2.4 GHz wireless", "A lightweight 300 gram wireless headset with a detachable boom mic and 50 mm drivers tuned for voice chat clarity.", ""],
  ['24" 144 Hz Gaming Monitor', "bytetech", "electronics", 189.99, 229.99, CATEGORY_IMAGES.electronics, 42, 4.8, 121, "24 inch, 144 Hz", "A 24 inch fast-IPS panel at 144 Hz with 1 ms response, HDMI 2.0 and a height-adjustable stand. Works with a Mac or a dorm laptop.", "deal"],
  ["Mechanical Numpad", "bytetech", "electronics", 45.0, 0, productImage("Electronics", "keyboard.png"), 76, 4.5, 84, "Hot-swap numpad", "A detachable numpad with matching hot-swap switches, so you can pair it with the 75% board or use it alone.", ""],
  ["USB-C Charging Cables, 3-Pack", "bytetech", "electronics", 16.99, 21.0, productImage("Electronics", "usb-c-hub.png"), 260, 4.6, 314, "1 m, 2 m, 3 m", "Braided 100 W charging cables with reinforced connectors. The 3 metre one reaches the outlet behind a dorm desk.", ""],
  ["Noise-Cancelling Earbuds", "bytetech", "electronics", 64.99, 84.99, productImage("Electronics", "headphones.png"), 150, 4.5, 243, "8 h + 24 h case", "Hybrid noise cancelling earbuds with transparency mode, wireless charging and an IPX5 rating for the walk across the quad.", ""],
  ["Portable SSD, 1 TB", "bytetech", "electronics", 96.0, 119.0, CATEGORY_IMAGES.electronics, 68, 4.7, 172, "1 TB, 1050 MB/s", "A pocket-sized USB 3.2 Gen 2 drive at 1050 MB/s. Backup a thesis in minutes, not an hour.", ""],

  /* ---------------- Study Station ---------------- */
  ["Semester Notebook Bundle, 5-Pack", "study-station", "school", 16.75, 21.0, productImage("School", "notebooks.png"), 320, 4.7, 396, "5 x 100 pages", "Five 100 gsm dot-grid notebooks with lay-flat binding and an index page. Enough to carry a full term in one bag.", "bestseller"],
  ["Student Graphing Calculator TI-84 Plus", "study-station", "school", 134.0, 149.95, productImage("School", "calculator.png"), 60, 4.8, 214, "TI-84 Plus", "The graphing calculator a calculus course expects. Approved for SAT and ACT, with exam mode and a rechargeable battery.", "bestseller"],
  ["Full Stationery Starter Kit", "study-station", "school", 28.5, 34.0, productImage("School", "stationery-set.png"), 145, 4.5, 187, "32 pieces", "Pens, mechanical pencils, highlighters, sticky notes, a ruler, an eraser and a sharpener in one zip case.", ""],
  ["Exam-Ready Flashcard Deck", "study-station", "school", 9.5, 12.0, productImage("School", "notebooks.png"), 210, 4.4, 132, "200 cards", "Two hundred indexable cards with a card guide and a spacing checklist, ready for a three-week review sprint.", ""],
  ["Campus Print Credits, 100 Pages", "study-station", "school", 12.0, 0, CATEGORY_IMAGES.school, 400, 4.6, 278, "100 B/W pages", "100 black-and-white pages plus 20 colour pages, loaded to your Campora account and usable at the Westwood counter.", ""],
  ["Résumé & Cover Letter Review", "study-station", "services", 29.0, 35.0, CATEGORY_IMAGES.services, 55, 4.8, 167, "48 hour turnaround", "A career services alum reviews your résumé and cover letter, then returns annotated versions with a rewrite of your summary and bullets.", "deal"],
  ["Calculus Tutoring, One Hour", "study-station", "services", 32.0, 0, CATEGORY_IMAGES.services, 90, 4.7, 231, "60 min, in person", "One hour with an upperclassman or graduate student tutor, matched to your course. Bring your problem set, leave with a plan.", "bestseller"],
  ["Organic Chemistry Study Group", "study-station", "services", 24.0, 28.0, CATEGORY_IMAGES.services, 70, 4.6, 156, "90 min, up to 4", "A small-group session covering reaction mechanisms and spectroscopy practice, capped at four students so everyone gets time.", ""],
  ["Thesis & Dissertation Binding", "study-station", "services", 18.0, 22.0, CATEGORY_IMAGES.services, 48, 4.5, 89, "Soft or hard cover", "Comb binding or hard cover with a foil title page, submitted in person or as a mailed PDF. Two-day turnaround.", ""],

  /* ---------------- Dormify ---------------- */
  ["Bamboo Bed Sheet Set, Twin XL", "dormify", "dorm", 46.0, 62.0, productImage("Dorm", "bedsheet.png"), 95, 4.7, 287, "Twin XL, fitted + flat", "A fitted sheet, flat sheet and one pillowcase in 300 thread-count bamboo. 38 x 80 inch, which is what residence hall mattresses actually measure.", "bestseller"],
  ["Adjustable LED Desk Lamp", "dormify", "dorm", 32.99, 39.99, productImage("Dorm", "desk-lamp.png"), 130, 4.6, 224, "5 colour temperatures", "Five colour temperatures from warm 2700 K to cool 6500 K, a flicker-free diffuser and a USB charging port in the base.", "bestseller"],
  ["Clip-On Mini Fan, 3 Speeds", "dormify", "dorm", 14.99, 18.99, productImage("Dorm", "mini-fan.png"), 240, 4.5, 341, "4 inch, USB-C", "A clip-on fan with three speeds and a 90 degree pivot. Quiet enough to run through a lecture, strong enough to cool a windowless room.", "deal"],
  ["Under-Bed Storage Bins, Set of 4", "dormify", "dorm", 38.5, 49.0, productImage("Dorm", "storage-box.png"), 86, 4.6, 198, "4 bins, 4 in tall", "Four low-profile fabric bins that fit under a raised dorm bed, each with side handles and a clear front panel.", ""],
  ["Dorm Room Starter Bundle", "dormify", "dorm", 96.0, 118.0, CATEGORY_IMAGES.dorm, 44, 4.8, 212, "Bedding, lamp, storage, fan", "The four things every room needs: a bamboo sheet set, an adjustable lamp, under-bed bins and a clip-on fan. Save 18% bundled.", "deal"],
  ["Blackout Curtain Panel", "dormify", "dorm", 27.0, 34.0, CATEGORY_IMAGES.dorm, 112, 4.5, 164, "42 x 84 in", "A 6 gsm blackout panel with clips, sized for standard residence hall windows. Turns a 7 a.m. sunrise into a 9 a.m. one.", ""],
  ["Laundry Hamper, Collapsible Frame", "dormify", "dorm", 24.99, 29.99, productImage("Dorm", "storage-box.png"), 158, 4.4, 176, "18 gal", "A collapsible frame and washable liner that stands up when there is laundry and folds flat when there is not.", ""],
  ["Fridge Organizer Set", "dormify", "dorm", 21.0, 26.0, CATEGORY_IMAGES.dorm, 124, 4.3, 148, "9 pieces", "Stackable bins, an egg holder, a can dispenser and a shelf riser sized for a dorm mini-fridge.", ""],
  ["Twin XL Mattress Topper", "dormify", "dorm", 58.0, 74.0, productImage("Dorm", "bedsheet.png"), 68, 4.7, 149, "3 in, memory foam", "A three-inch quilted memory foam topper that turns a hard residence hall mattress into something you can actually sleep on.", ""],

  /* ---------------- FitFuel ---------------- */
  ["Non-Slip Yoga Mat, 6 mm", "fitfuel", "fitness", 38.0, 46.0, productImage("Fitness", "yoga-mat.png"), 145, 4.7, 263, "72 x 24 in", "A 6 mm closed-cell mat with an aligned-grip surface that holds in a heated room. Includes a carry strap.", "bestseller"],
  ["Insulated Water Bottle, 32 oz", "fitfuel", "fitness", 26.99, 32.0, productImage("Fitness", "water-bottles.png"), 210, 4.6, 331, "32 oz, 24 h cold", "Double-wall vacuum insulation, a leak-resistant sport cap and a powder coat finish that survives a bike bottle cage.", "bestseller"],
  ["Adjustable Dumbbell Pair, 25 lb", "fitfuel", "fitness", 119.0, 149.0, productImage("Fitness", "dumbbells.png"), 34, 4.8, 148, "2 x 25 lb", "A dial-adjustment dumbbell pair that replaces sixteen fixed weights. Swap plates in under five seconds, one hand on the dial.", ""],
  ["Campus Fitness Starter Kit", "fitfuel", "fitness", 74.0, 88.0, CATEGORY_IMAGES.fitness, 52, 4.6, 187, "Mat, bands, bottle, strap", "A mat, three resistance bands, a 32 oz bottle and a lifting strap. Everything a first-semester athlete needs to start training.", "deal"],
  ["Hydration Shaker + Tablets", "fitfuel", "fitness", 18.0, 22.0, productImage("Fitness", "water-bottles.png"), 178, 4.4, 121, "24 oz, 40 tablets", "A 24 oz shaker with a mixing grid and forty electrolyte tablets. Dissolves clear in cold water.", ""],
  ["Resistance Band Set, 5 Pieces", "fitfuel", "fitness", 19.99, 24.99, productImage("Fitness", "yoga-mat.png"), 168, 4.5, 197, "5 bands, 10-50 lb", "Five latex-free resistance bands from 10 to 50 pounds with door anchors and handles. Rolls down to the size of a water bottle.", ""],
  ["Speed Jump Rope", "fitfuel", "fitness", 12.99, 0, CATEGORY_IMAGES.fitness, 190, 4.3, 134, "10 ft, adjustable", "A steel-cable speed rope with a ball-bearing handle and a tool-free length adjustment. Tangles less than a nylon rope.", ""],
  ["Recovery Foam Roller", "fitfuel", "fitness", 29.99, 34.99, CATEGORY_IMAGES.fitness, 96, 4.6, 118, "18 in, textured", "A high-density textured roller for calves, quads and shoulders. Firm enough to work, soft enough to sleep on.", ""],
  ["Rec Center Day Pass", "fitfuel", "fitness", 9.0, 0, CATEGORY_IMAGES.fitness, 500, 4.7, 402, "Single day", "One-day access to the campus recreation centre, including the weight floor, pool deck and group fitness studios.", ""],

  /* ---------------- Beauty (The Campus Closet) ---------------- */
  ["Daily Skincare Routine Set", "campus-closet", "beauty", 42.0, 54.0, productImage("Beauty", "skincare-set.png"), 88, 4.7, 246, "5 pieces", "A gentle cleanser, vitamin C serum, moisturiser, SPF 30 and a nightly retinol. Formulated to layer without pilling under sunscreen.", "bestseller"],
  ["Nourishing Hair Care Duo", "campus-closet", "beauty", 24.5, 29.0, productImage("Beauty", "hair-care.png"), 120, 4.5, 178, "2 pieces", "A sulfate-free shampoo and a leave-in conditioner made for hair that sees a dryer twice a week.", ""],
  ["Hydrating Body Care Kit", "campus-closet", "beauty", 19.99, 24.99, productImage("Beauty", "body-care.png"), 134, 4.4, 156, "3 pieces", "Body wash, moisturising lotion and a hand cream with ceramides. Unscented options available for shared rooms.", ""],
  ["Mineral SPF 50 Sunscreen", "campus-closet", "beauty", 16.0, 19.0, CATEGORY_IMAGES.beauty, 190, 4.6, 212, "3.5 oz, 50 SPF", "A zinc oxide sunscreen with no white cast, a matte finish that works under makeup, and water resistance for the pool deck.", ""],
  ["Overnight Repair Mask", "campus-closet", "beauty", 18.0, 22.0, productImage("Beauty", "skincare-set.png"), 110, 4.5, 143, "2.5 oz", "A peptide and ceramide mask you leave on overnight. Visible difference after three nights of a bad sleep schedule.", ""],
  ["Travel Beauty Sampler", "campus-closet", "beauty", 12.0, 15.0, CATEGORY_IMAGES.beauty, 145, 4.3, 98, "8 minis", "Eight 15 ml minis of cleanser, serum, moisturiser, lip balm and masks. Sized for a carry-on week or a spring break trip.", "deal"],

  /* ---------------- Gaming (ByteTech) ---------------- */
  ["RGB Extended Mousepad", "bytetech", "gaming", 22.0, 27.0, CATEGORY_IMAGES.gaming, 185, 4.4, 167, "31 x 12 in", "A stitched-edge desk mat with a soft cloth surface and a low-friction base that stays put while you flick.", ""],
  ["Controller Charging Dock", "bytetech", "gaming", 34.99, 39.99, productImage("Gaming", "gaming-controller.png"), 96, 4.5, 112, "2 controllers", "Charges two controllers on a weighted dock with status LEDs. Cable management underneath keeps the desk clean.", ""],
  ["Tournament Lanyard & Badge Kit", "bytetech", "gaming", 9.0, 12.0, CATEGORY_IMAGES.gaming, 260, 4.2, 88, "Lanyard, badge, holder", "A printed lanyard, badge insert and badge holder for club tournaments, campus esports nights and LAN events.", ""],
  ["Streaming Starter Mic Kit", "bytetech", "gaming", 68.0, 84.0, CATEGORY_IMAGES.gaming, 58, 4.5, 134, "USB condenser", "A USB condenser microphone on a desk arm with a pop filter and shock mount. Plugs in and shows up as a mic, nothing else to configure.", ""],

  /* ---------------- Gifts (Campus Creatives) ---------------- */
  ["Custom Print Canvas Tote", "campus-creatives", "gifts", 19.0, 24.0, productImage("Gifts", "gift-box.png"), 175, 4.8, 204, "15 x 16 in", "A heavyweight canvas tote with a single-colour print of your design, club logo or a photo from the group chat.", "bestseller"],
  ["Insulated Campus Tumbler, 16 oz", "campus-creatives", "gifts", 16.5, 21.0, productImage("Gifts", "campus-mug.png"), 240, 4.7, 289, "16 oz", "A double-wall steel tumbler with a press-fit lid that resists leaking into a backpack. Engraving available at checkout.", "bestseller"],
  ["Custom Photo Mug, 11 oz", "campus-creatives", "gifts", 15.0, 0, productImage("Gifts", "campus-mug.png"), 195, 4.6, 231, "11 oz, dishwasher safe", "A classic ceramic mug wrapped with a photo. Dishwasher and microwave safe, and it survives a dorm dishwasher better than you expect.", ""],
  ["Graduation Care Package", "campus-creatives", "gifts", 44.99, 52.0, productImage("Gifts", "gift-box.png"), 62, 4.9, 142, "9 items", "A hoodie, a mug, granola, a candle, a notebook and the rest of the list, packed in a gift box with a handwritten card.", "deal"],
  ["Personalized Notebook", "campus-creatives", "gifts", 12.0, 15.0, productImage("School", "notebooks.png"), 160, 4.5, 176, "160 pages", "A lay-flat notebook with your name or your organisation printed on the cover. Add a short line of text for free.", ""],
  ['"I Survived Finals" Gift Box', "campus-creatives", "gifts", 28.0, 34.0, CATEGORY_IMAGES.gifts, 88, 4.8, 167, "7 items", "Coffee, tea, dark chocolate, a stress ball, a candle, a face mask and a card that says exactly what it says.", "deal"],

  /* ---------------- Student Services ---------------- */
  ["Résumé Rewrite", "study-station", "services", 35.0, 45.0, CATEGORY_IMAGES.services, 70, 4.8, 154, "72 hour turnaround", "A complete rewrite of your résumé, tailored to one job description, with a recruiter's-eye line-by-line review.", ""],
  ["Campus Poster Printing, 18 x 24", "campus-creatives", "services", 8.5, 0, CATEGORY_IMAGES.services, 320, 4.6, 287, "18 x 24 in, matte", "Full-colour 18 x 24 matte poster, printed on 200 gsm stock. Upload your file and pick up from the studio counter.", "bestseller"],
  ["Same-Day Photo Print", "campus-creatives", "services", 5.0, 0, CATEGORY_IMAGES.services, 280, 4.5, 312, "4 x 6 in", "A glossy 4 x 6 print from your phone, ready in about 25 minutes. Bring a file on a USB stick or email it to the studio.", ""],
  ["Business Card Run, 200 Count", "campus-creatives", "services", 22.0, 28.0, CATEGORY_IMAGES.services, 140, 4.6, 118, "200 cards, matte", "Two hundred 16 pt matte business cards with a standard bleed, printed two-sided with a free proof before the run.", ""],
  ["Landing Page Build", "campus-creatives", "services", 249.0, 299.0, CATEGORY_IMAGES.services, 30, 4.7, 61, "5 day turnaround", "A responsive single-page site with your copy, a contact form and analytics, built to be edited by a non-developer afterwards.", "deal"],
  ["Dorm Room Photography", "campus-creatives", "services", 75.0, 90.0, CATEGORY_IMAGES.services, 40, 4.8, 74, "90 min, 30 images", "A student photographer shoots your room in natural light and delivers 30 retouched images. Popular for sublets and tours.", ""],
  ["Presentation Coaching, 1 Hour", "study-station", "services", 30.0, 0, CATEGORY_IMAGES.services, 85, 4.5, 129, "60 min", "Rehearse your talk with a coach who will cut it to the time you actually have and fix the transitions that drag.", ""],
  ["Bike Tune-Up & Tune", "campus-closet", "transportation", 39.0, 45.0, CATEGORY_IMAGES.transportation, 45, 4.4, 92, "90 min, walk-in", "Brakes, gears, chain, tyre pressure and a full safety check. Most bikes are ready the same day.", ""],
  ["E-Scooter Weekly Pass", "fitfuel", "transportation", 15.0, 19.0, CATEGORY_IMAGES.transportation, 260, 4.3, 141, "7 days, unlimited unlocks", "Seven days of unlimited e-scooter unlocks with a helmet included. Student-verified pricing at checkout.", ""],
  ["Scooter Safety Gear Bundle", "fitfuel", "transportation", 34.99, 42.0, CATEGORY_IMAGES.transportation, 74, 4.5, 98, "Helmet, pads, light", "A certified helmet, knee and elbow pads, and a front LED light sized for commuting across campus at night.", ""],
  ["Parking Validation Pass", "dormify", "transportation", 11.0, 0, CATEGORY_IMAGES.transportation, 310, 4.1, 76, "Single day", "One validated parking day in the structure nearest the library. Show the pass at the pay station and park on campus.", ""],
  ["Airport Shuttle Seat", "study-station", "transportation", 24.0, 29.0, CATEGORY_IMAGES.transportation, 150, 4.2, 88, "One way", "A reserved seat on the campus airport shuttle with luggage space. Book a week ahead for holiday breaks.", ""],
  ["Heavy-Duty Bike Lock", "dormify", "transportation", 27.99, 33.0, CATEGORY_IMAGES.transportation, 92, 4.6, 103, "1.8 m, hardened steel", "A hardened steel U-lock with a mounting bracket and a key that works with your dorm door. Sold with two keys.", ""],
];

/**
 * Build the product documents from the compact catalog above.
 * The index of each row is stable, so SKUs and seeded review counts stay
 * deterministic across re-seeds.
 */
const PRODUCTS = RAW_PRODUCTS.map((row, index) => {
  const [
    name,
    storeSlug,
    categorySlug,
    price,
    compareAtPrice,
    image,
    stock,
    rating,
    reviewCount,
    unit,
    description,
    badge,
  ] = row;

  const prefix = storeSlug
    .split("-")
    .map((part) => part.slice(0, 2).toUpperCase())
    .join("")
    .slice(0, 4);
  const sku = `${prefix}-${categorySlug.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(3, "0")}`;

  const tags = [
    categorySlug.replace(/-/g, " "),
    ...(badge ? [badge] : []),
    ...name
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 4)
      .slice(0, 3),
  ];

  return {
    name,
    slug: name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 70),
    storeSlug,
    categorySlug,
    price,
    compareAtPrice,
    images: [image],
    stock,
    rating: { average: rating, count: reviewCount },
    soldCount: Math.round(reviewCount * 2.6 + (index % 7) * 3),
    description,
    details: description,
    unit,
    sku,
    tags: Array.from(new Set(tags)),
    specs: SPEC_PRESETS[categorySlug] || [],
    status: "active",
    featured: badge === "bestseller",
    deal: { isDeal: Boolean(badge === "deal" || compareAtPrice > price), badge: badge === "deal" ? "Campus deal" : "" },
  };
});

/* ------------------------------------------------------------------ *
 * Review copy pool
 * ------------------------------------------------------------------ */

const REVIEW_TEMPLATES = {
  5: [
    "Exactly as described and it arrived faster than I expected. This is the third time I've ordered from this store.",
    "Worth every penny. I use it almost every day and it still looks brand new after a full semester.",
    "Genuinely better quality than I expected at this price. I have recommended it to two people in my building.",
    "Showed up in under half an hour and was packed really well. Everything was here, nothing was missing.",
    "I was skeptical about ordering this instead of buying it in person. I was wrong. Great product.",
  ],
  4: [
    "Really solid. Took one star off only because the packaging could be more protective during delivery.",
    "Good product, quick delivery. Would like a few more colour options for next time.",
    "Happy with it. It's not perfect but it does exactly what I need and it was fairly priced.",
    "Nice quality overall. Shipping took a day longer than the estimate but the item itself is great.",
  ],
  3: [
    "It does the job, nothing more. Fine for the price but I wouldn't buy it again at full price.",
    "Average experience. The item was fine but the packaging was minimal and one corner was dented.",
    "Okay for a starter, though it felt smaller than I expected from the photos.",
  ],
  2: [
    "Not what I expected. The photo makes it look better than what arrived. Requesting a refund.",
    "Quality was fine but it took far longer than the stated window and nobody updated me in the meantime.",
  ],
};

const REVIEW_TITLES = {
  5: ["Exactly what I needed", "Worth it", "Great quality", "Will buy again", "Fast and easy"],
  4: ["Very good overall", "Happy with it", "Solid buy", "Good, minor notes"],
  3: ["Does the job", "Fine, not remarkable", "Okay for the price"],
  2: ["Not as described", "Slower than expected"],
};

/* ------------------------------------------------------------------ *
 * Demo accounts
 * ------------------------------------------------------------------ */

const DEMO_PASSWORD = "campora123";

const CUSTOMERS = [
  {
    name: "Avery Johnson",
    email: "student@campora.market",
    role: "customer",
    university: { code: "ucla", name: "University of California, Los Angeles" },
    avatarIndex: 0,
    phone: "(310) 555-0201",
    bio: "Junior studying economics. Splitting rent on a three-bedroom off campus.",
  },
  {
    name: "Maya Patel",
    email: "maya@campora.market",
    role: "customer",
    university: { code: "utexas", name: "University of Texas at Austin" },
    avatarIndex: 1,
    phone: "(512) 555-0233",
    bio: "Nursing student, vegetarian, permanently looking for good coffee near the quad.",
  },
  {
    name: "Leo Nakamura",
    email: "leo@campora.market",
    role: "customer",
    university: { code: "nyu", name: "New York University" },
    avatarIndex: 2,
    phone: "(212) 555-0244",
    bio: "Film studies. Buys more desk lamps than any person should.",
  },
  {
    name: "Sofia Hernandez",
    email: "sofia@campora.market",
    role: "customer",
    university: { code: "uw", name: "University of Washington" },
    avatarIndex: 3,
    phone: "(206) 555-0255",
    bio: "Running club captain, part-time barista, recovering gear hoarder.",
  },
  {
    name: "Daniel Okafor",
    email: "daniel@campora.market",
    role: "customer",
    university: { code: "umich", name: "University of Michigan" },
    avatarIndex: 4,
    phone: "(734) 555-0266",
    bio: "Pre-med. Buys study supplies in bulk right before finals.",
  },
  {
    name: "Grace Lin",
    email: "grace@campora.market",
    role: "customer",
    university: { code: "ufl", name: "University of Florida" },
    avatarIndex: 5,
    phone: "(352) 555-0277",
    bio: "Design major. Will spend twenty minutes choosing a notebook colour.",
  },
  {
    name: "Ethan Brooks",
    email: "ethan@campora.market",
    role: "customer",
    university: { code: "osu", name: "Ohio State University" },
    avatarIndex: 6,
    phone: "(614) 555-0288",
    bio: "Mechanical engineering. Firmware is a lifestyle.",
  },
  {
    name: "Nia Thompson",
    email: "nia@campora.market",
    role: "customer",
    university: { code: "usc", name: "University of Southern California" },
    avatarIndex: 7,
    phone: "(213) 555-0299",
    bio: "Senior wrapping up a thesis. Extremely tired.",
  },
];

const SELLER_OWNERS = [
  { name: "Jordan Ellis", email: "seller@campora.market", store: "campus-grocery-co", avatarIndex: 8 },
  { name: "Priya Raman", email: "seller2@campora.market", store: "campus-closet", avatarIndex: 9 },
  { name: "Marcus Webb", email: "seller3@campora.market", store: "bytetech", avatarIndex: 0 },
  { name: "Camila Santos", email: "seller4@campora.market", store: "green-bowl", avatarIndex: 1 },
  { name: "Tobias Wright", email: "seller5@campora.market", store: "study-station", avatarIndex: 2 },
  { name: "Hana Kim", email: "seller6@campora.market", store: "dormify", avatarIndex: 3 },
  { name: "Andre Collins", email: "seller7@campora.market", store: "fitfuel", avatarIndex: 4 },
  { name: "Elena Rossi", email: "seller8@campora.market", store: "campus-creatives", avatarIndex: 5 },
  { name: "Rosa Delgado", email: "seller9@campora.market", store: "sunset-snack-bar", avatarIndex: 6 },
];

const ADMIN = {
  name: "Alex Moreno",
  email: "admin@campora.market",
  role: "admin",
  university: { code: "other", name: "My community (non-campus)" },
  avatarIndex: 7,
  bio: "Marketplace operations at Campora.",
};

module.exports = {
  CATEGORIES,
  STORES,
  PRODUCTS,
  REVIEW_TEMPLATES,
  REVIEW_TITLES,
  CUSTOMERS,
  SELLER_OWNERS,
  ADMIN,
  DEMO_PASSWORD,
  STORE_ASSETS,
  AVATARS,
  HERO_IMAGES,
  CATEGORY_IMAGES,
  productImage,
};
