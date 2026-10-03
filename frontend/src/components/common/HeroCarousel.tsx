import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Circle } from "lucide-react";
import { HERO_IMAGES } from "../../data/images";
import { SmartImage } from "../ui/SmartImage";
import { cx } from "../../utils/format";

const slides = [
  {
    src: HERO_IMAGES.shopping,
    label: "Dorm shopping",
    headline: "Your campus, one marketplace",
    subheadline: "Groceries, meals, textbooks, tech, and essentials from verified sellers.",
  },
  {
    src: HERO_IMAGES.food,
    label: "Late-night meals",
    headline: "Crave-worthy meals",
    subheadline: "Hot food delivered to your dorm when the library closes.",
  },
  {
    src: HERO_IMAGES.groceries,
    label: "Weekly groceries",
    headline: "Stock your pantry",
    subheadline: "Fresh groceries from campus stores near you, delivered fast.",
  },
  {
    src: HERO_IMAGES.dorm,
    label: "Dorm refresh",
    headline: "Make it your space",
    subheadline: "Bedding, decor, and dorm essentials at student-friendly prices.",
  },
  {
    src: HERO_IMAGES.lifestyle,
    label: "Student life",
    headline: "Built for campus life",
    subheadline: "Student-made services, deals, and more - all in one place.",
  },
];

const transition = { duration: 0.6, ease: [0.16, 1, 0.3, 1] };

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setIndex((current) => (current + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setIndex((current) => (current - 1 + slides.length) % slides.length);
  }, []);

  const goTo = useCallback((i: number) => {
    setIndex(i);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 6500);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  return (
    <div
      className="hero-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="hero-carousel__viewport">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={index}
            className="hero-carousel__slide"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={transition}
          >
            <SmartImage
              src={slides[index].src}
              alt={slides[index].label}
              ratio="hero"
              className="hero-carousel__image"
              loading="eager"
            />
            <div className="hero-carousel__gradient" />
            <motion.div
              className="hero-carousel__overlay"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="hero-carousel__eyebrow">
                <span>Campora</span> · The Campus Marketplace
              </p>
              <h2 className="hero-carousel__headline">{slides[index].headline}</h2>
              <p className="hero-carousel__subheadline">{slides[index].subheadline}</p>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <button
          type="button"
          className="hero-carousel__nav hero-carousel__nav--prev"
          onClick={prev}
          aria-label="Previous slide"
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="hero-carousel__nav hero-carousel__nav--next"
          onClick={next}
          aria-label="Next slide"
        >
          <ChevronRight size={22} aria-hidden="true" />
        </button>

        <div className="hero-carousel__indicators">
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              className={cx("hero-carousel__dot", i === index && "is-active")}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}: ${slide.label}`}
              aria-current={i === index}
            >
              <Circle size={i === index ? 10 : 6} aria-hidden="true" />
            </button>
          ))}
        </div>

        <div className="hero-carousel__progress">
          <span
            className="hero-carousel__progress-bar"
            key={index}
            style={{ animation: !isPaused ? "carousel-progress 6.5s linear forwards" : "none" }}
          />
        </div>
      </div>
    </div>
  );
}
