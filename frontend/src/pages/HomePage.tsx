import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Bike,
  BookOpen,
  Clock3,
  CreditCard,
  Headphones,
  Leaf,
  MapPin,
  Package,
  Quote,
  Sparkles,
  Store,
  Truck,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { marketplaceService } from "../services/marketplace";
import { useAsync } from "../hooks/useAsync";
import { useUniversity } from "../context/UniversityContext";
import { useAuth } from "../context/AuthContext";
import type { HomeFeed } from "../types";
import { currency, numberCompact } from "../utils/format";
import { CATEGORY_IMAGES, STORE_IMAGES } from "../data/images";
import { SearchBar } from "../components/common/SearchBar";
import { ProductGrid } from "../components/common/ProductCard";
import { StoreCard } from "../components/common/StoreCard";
import { CategoryTiles } from "../components/common/CategoryCard";
import { SectionHeader, TrustStrip } from "../components/common/SectionHeader";
import { HeroCarousel } from "../components/common/HeroCarousel";
import { SmartImage, StoreLogo } from "../components/ui/SmartImage";
import { CardGridSkeleton, ErrorState, ProductGridSkeleton } from "../components/ui/Feedback";


const HOW_IT_WORKS = [
  {
    step: "1",
    icon: MapPin,
    title: "Pick your campus",
    text: "Tell us where you study and we surface the stores that actually deliver to you.",
  },
  {
    step: "2",
    icon: Store,
    title: "Shop student sellers",
    text: "Groceries, meals, textbooks, tech, dorm gear and services — all from verified campus sellers.",
  },
  {
    step: "3",
    icon: Truck,
    title: "Track to your door",
    text: "Follow your order live from confirmed to out for delivery, right inside your account.",
  },
];

const SELLER_POINTS = [
  { icon: Wallet, title: "Keep 92% of sales", text: "A simple 8% marketplace fee with no subscription and no setup cost." },
  { icon: Zap, title: "Set your own hours", text: "Open when you want, pause during finals, and edit your catalogue any time." },
  { icon: Users, title: "Reach your campus", text: "Students searching your campus see you first — no ad budget required." },
  { icon: BadgeCheck, title: "Verification badge", text: "Approved sellers earn a verified badge, which converts browsers into buyers." },
];

const BENEFITS = [
  { icon: Clock3, title: "Open late", text: "Orders keep moving after the library closes — stores set their own hours." },
  { icon: CreditCard, title: "Simple demo checkout", text: "A local simulated payment step, so you can test the whole flow offline." },
  { icon: Headphones, title: "Human support", text: "Real order problems get real responses, not automated deflection." },
  { icon: Leaf, title: "Less waste", text: "Group orders and campus pickup reduce single-item delivery trips." },
];

function Hero({ campusLabel }: { campusLabel: string }) {
  const { isAuthenticated, user } = useAuth();

  return (
    <section className="hero">
      <div className="container hero__inner">
        <motion.div
          className="hero__copy"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="hero__pill">
            <Sparkles size={14} aria-hidden="true" />
            {numberCompact(9)} campus stores · same-day delivery
          </p>
          <h1 className="hero__title">
            Your campus,
            <br />
            <span className="hero__title-accent">one marketplace.</span>
          </h1>
          <p className="hero__text">
            Groceries, meals, textbooks, tech, dorm essentials and student-made services — from
            verified sellers who deliver to <strong>{campusLabel}</strong> and beyond.
          </p>

          <div className="hero__search">
            <SearchBar variant="hero" />
          </div>

          <div className="hero__actions">
            <Link to="/explore" className="btn btn--primary btn--lg">
              Start shopping
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link to="/sell" className="btn btn--outline btn--lg">
              <Store size={17} aria-hidden="true" />
              Sell on Campora
            </Link>
          </div>

          <p className="hero__meta">
            {isAuthenticated ? (
              <>
                Signed in as <strong>{user?.name}</strong> ·{" "}
                <Link to="/account/orders">track your orders</Link>
              </>
            ) : (
              <>
                New here? <Link to="/register">Create a free account</Link> — it takes under a minute.
              </>
            )}
          </p>
        </motion.div>

        <motion.div
          className="hero__visual"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeroCarousel />

          <div className="hero__float hero__float--delivery">
            <span className="hero__float-icon">
              <Bike size={17} aria-hidden="true" />
            </span>
            <span>
              <strong>On the way</strong>
              <em>Order #CMP-20481 · 18 min</em>
            </span>
          </div>
          <div className="hero__float hero__float--rating">
            <span className="hero__float-icon hero__float-icon--warm">
              <BadgeCheck size={17} aria-hidden="true" />
            </span>
            <span>
              <strong>4.8 average</strong>
              <em>across 89 verified reviews</em>
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CategorySection({ categories }: { categories: HomeFeed["categories"] }) {
  if (!categories.length) return null;
  return (
    <section className="section section--tight">
      <div className="container">
        <SectionHeader
          eyebrow="Browse by need"
          title="What are you shopping for?"
          description="Twelve categories, stocked by sellers who understand the campus rhythm."
          action={
            <Link to="/explore" className="link-arrow">
              See everything
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          }
        />
        <CategoryTiles categories={categories} />
      </div>
    </section>
  );
}

function DealsSection({ products }: { products: HomeFeed["deals"] }) {
  if (!products.length) return null;
  return (
    <section className="section section--alt">
      <div className="container">
        <SectionHeader
          eyebrow="Limited time"
          title="Deals near you"
          description="Discounts set by campus sellers — usually gone by Sunday night."
          action={
            <Link to="/deals" className="link-arrow">
              All deals
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          }
        />
        <ProductGrid products={products.slice(0, 8)} />
      </div>
    </section>
  );
}

function StoresSection({ stores }: { stores: HomeFeed["featuredStores"] }) {
  if (!stores.length) return null;
  return (
    <section className="section">
      <div className="container">
        <SectionHeader
          eyebrow="Verified sellers"
          title="Campus stores shoppers trust"
          description="Every featured store has been reviewed by the Campora team and rated by students."
          action={
            <Link to="/stores" className="link-arrow">
              All stores
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          }
        />
        <div className="store-grid">
          {stores.slice(0, 3).map((store, index) => (
            <StoreCard key={store._id} store={store} index={index} />
          ))}
        </div>

        <div className="store-marquee" aria-label="More campus stores">
          {stores.slice(3).map((store) => (
            <Link key={store._id} to={`/stores/${store.slug}`} className="store-marquee__item">
              <StoreLogo logo={store.logo} name={store.name} size="sm" />
              <span>
                <strong>{store.name}</strong>
                <em>{store.tagline}</em>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrendingSection({ products }: { products: HomeFeed["trending"] }) {
  if (!products.length) return null;
  return (
    <section className="section">
      <div className="container">
        <SectionHeader
          eyebrow="Selling fast"
          title="Trending on campus"
          description="What students near you are ordering this week."
          action={
            <Link to="/explore?sort=popular" className="link-arrow">
              See all trending
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          }
        />
        <ProductGrid products={products} />
      </div>
    </section>
  );
}

function NewArrivalsSection({ products }: { products: HomeFeed["newArrivals"] }) {
  if (!products.length) return null;
  return (
    <section className="section section--alt">
      <div className="container">
        <SectionHeader
          eyebrow="Fresh listings"
          title="New arrivals from sellers"
          description="Just listed by campus stores over the past few days."
          action={
            <Link to="/explore?sort=newest" className="link-arrow">
              Browse new arrivals
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          }
        />
        <ProductGrid products={products} />
      </div>
    </section>
  );
}

function SellerSection() {
  return (
    <section className="section seller-section">
      <div className="container seller-section__inner">
        <div className="seller-section__copy">
          <p className="eyebrow">For sellers</p>
          <h2 className="section-title">Run your campus store on Campora</h2>
          <p className="section-description">
            You bring the products; Campora brings the students. Set your catalogue, your hours and
            your delivery area, then let campus order from you.
          </p>
          <ul className="seller-points">
            {SELLER_POINTS.map((point) => (
              <li key={point.title}>
                <span className="seller-points__icon">
                  <point.icon size={18} aria-hidden="true" />
                </span>
                <span>
                  <strong>{point.title}</strong>
                  <em>{point.text}</em>
                </span>
              </li>
            ))}
          </ul>
          <div className="seller-section__actions">
            <Link to="/sell" className="btn btn--accent btn--lg">
              Open your store
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link to="/help#sellers" className="btn btn--ghost btn--lg">
              Read the seller guide
            </Link>
          </div>
        </div>

        <div className="seller-section__visual">
          <div className="seller-preview">
            <header className="seller-preview__head">
              <StoreLogo
                logo={STORE_IMAGES["campus-grocery-co"]?.logo}
                name="Campus Grocery Co."
                size="md"
              />
              <div>
                <strong>Campus Grocery Co.</strong>
                <em>Verified · 0.4 mi from you</em>
              </div>
            </header>
            <div className="seller-preview__stats">
              <span>
                <strong>128</strong> products
              </span>
              <span>
                <strong>4.9</strong> rating
              </span>
              <span>
                <strong>18 min</strong> delivery
              </span>
            </div>
            <ul className="seller-preview__list">
              {[
                { name: "Overnight Oats & Granola", price: 6.5, was: 8, img: CATEGORY_IMAGES.groceries },
                { name: "Iced Coffee Duo", price: 7.25, was: 0, img: CATEGORY_IMAGES.food },
                { name: "Study Snack Box", price: 12, was: 15, img: CATEGORY_IMAGES.groceries },
              ].map((row) => (
                <li key={row.name}>
                  <SmartImage src={row.img} alt={row.name} ratio="square" fallbackLabel={row.name} />
                  <span>
                    <strong>{row.name}</strong>
                    <em>{currency(row.price)}{row.was ? ` · was ${currency(row.was)}` : ""}</em>
                  </span>
                </li>
              ))}
            </ul>
            <p className="seller-preview__foot">
              <BookOpen size={14} aria-hidden="true" /> Live order updates keep students in the loop
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <>
      <section className="section section--tight">
      <div className="container">
        <div className="benefit-grid">
          {BENEFITS.map((benefit) => (
            <article className="benefit" key={benefit.title}>
              <span className="benefit__icon">
                <benefit.icon size={19} aria-hidden="true" />
              </span>
              <h3>{benefit.title}</h3>
              <p>{benefit.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

      <section className="section section--how">
        <div className="container">
          <header className="section-header">
            <div className="section-header__text">
              <p className="eyebrow">How it works</p>
              <h2 className="section-title">Three steps between you and your dorm door</h2>
              <p className="section-description">
                No subscription, no ad budget, no mystery markups — just stores near you and a checkout
                that works.
              </p>
            </div>
          </header>
          <ol className="step-grid">
            {HOW_IT_WORKS.map((entry) => (
              <li key={entry.step} className="step-card">
                <span className="step-card__number">{entry.step}</span>
                <span className="step-card__icon">
                  <entry.icon size={20} aria-hidden="true" />
                </span>
                <h3>{entry.title}</h3>
                <p>{entry.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

function TestimonialSection() {
  return (
    <section className="section section--alt">
      <div className="container">
        <SectionHeader
          eyebrow="Student voices"
          title="Loved across campus"
          align="center"
          description="Reviews on Campora come from verified purchases only — no anonymous ratings."
        />
        <div className="testimonial-grid">
          {[
            {
              quote:
                "I ordered coffee and a study snack box twenty minutes before my lecture. The seller updated the order in real time and a student courier dropped it at my dorm.",
              name: "Maya R.",
              detail: "Sophomore · verified buyer",
              image: "/images/avatars/avatar-02.jpg",
            },
            {
              quote:
                "Selling textbooks through Campora took one evening instead of a week of posting around campus. The verified badge did most of the work for me.",
              name: "Dev P.",
              detail: "Seller · Campus Closet",
              image: "/images/avatars/avatar-05.jpg",
            },
            {
              quote:
                "The pickup option is the reason I use it. I order from Green Bowl between lectures and grab it on my way back to the library.",
              name: "Jordan T.",
              detail: "Junior · verified buyer",
              image: "/images/avatars/avatar-08.jpg",
            },
          ].map((entry) => (
            <figure className="testimonial" key={entry.name}>
              <Quote size={22} className="testimonial__mark" aria-hidden="true" />
              <blockquote>{entry.quote}</blockquote>
              <figcaption>
                <img src={entry.image} alt="" loading="lazy" />
                <span>
                  <strong>{entry.name}</strong>
                  <em>{entry.detail}</em>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection({ campusLabel }: { campusLabel: string }) {
  return (
    <section className="cta-band">
      <div className="container cta-band__inner">
        <div>
          <h2>Ready to shop {campusLabel}?</h2>
          <p>
            Create an account to save items, track deliveries and keep your campus favourites in one
            place.
          </p>
        </div>
        <div className="cta-band__actions">
          <Link to="/register" className="btn btn--accent btn--lg">
            Create your account
          </Link>
          <Link to="/explore" className="btn btn--outline btn--lg">
            Browse first
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const { university, campusLabel } = useUniversity();
  const { data, loading, error, reload } = useAsync<HomeFeed>(
    () => marketplaceService.home(university?.code, 10),
    [university?.code]
  );

  return (
    <>
      <Hero campusLabel={campusLabel} />

      <div className="container">
        <TrustStrip
          items={[
            { icon: <Truck size={17} aria-hidden="true" />, title: "Free over $35", text: "Per store, on campus delivery" },
            { icon: <Clock3 size={17} aria-hidden="true" />, title: "Live order tracking", text: "From confirmed to delivered" },
            { icon: <BadgeCheck size={17} aria-hidden="true" />, title: "Verified sellers", text: "Reviewed by the Campora team" },
            { icon: <Package size={17} aria-hidden="true" />, title: "99 products in stock", text: "Across 9 campus stores" },
          ]}
        />
      </div>

      {error ? (
        <div className="container section">
          <ErrorState
            title="We could not load the marketplace"
            message={`${error} — is the Campora API running on port 5050?`}
            onRetry={reload}
          />
        </div>
      ) : null}

      {loading && !data ? (
        <>
          <div className="container section">
            <div className="section-placeholder">
              <CardGridSkeleton count={3} />
            </div>
          </div>
          <div className="container section">
            <ProductGridSkeleton count={8} />
          </div>
        </>
      ) : null}

      {data ? (
        <>
          <CategorySection categories={data.categories} />
          <DealsSection products={data.deals} />
          <StoresSection stores={data.featuredStores} />
          <TrendingSection products={data.trending} />
          <NewArrivalsSection products={data.newArrivals} />
          <SellerSection />
          <BenefitsSection />
          <TestimonialSection />
          <CtaSection campusLabel={campusLabel} />
        </>
      ) : null}
    </>
  );
}
