import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import "./HeroSlider.css";

export default function HeroSlider({ slides }) {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    setIndex((i) => (slides.length ? (i + 1) % slides.length : 0));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  if (!slides.length) return null;
  const slide = slides[index];

  return (
    <section className="hero-slider" aria-roledescription="carousel">
      <div className="hero-slide" style={{ backgroundImage: `url(${slide.imageUrl})` }}>
        <div className="hero-overlay" />
        <div className="container hero-content">
          <h1>{slide.heading}</h1>
          {slide.description && <p>{slide.description}</p>}
          <Link to={slide.ctaLink || "/products"} className="btn btn-accent hero-cta">
            {slide.ctaText || "Shop Now"}
          </Link>
        </div>
      </div>
      <div className="hero-torn-edge" aria-hidden="true" />
      {slides.length > 1 && (
        <div className="hero-dots">
          {slides.map((s, i) => (
            <button
              key={s._id}
              className={`hero-dot ${i === index ? "active" : ""}`}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
