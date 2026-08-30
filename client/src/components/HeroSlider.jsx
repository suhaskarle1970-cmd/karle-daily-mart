import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import "./HeroSlider.css";

const AUTOPLAY_MS = 4000;
const TRANSITION_MS = 900;
const CONTROLS_HIDE_MS = 3000;

export default function HeroSlider({ slides }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState({});
  const [showControls, setShowControls] = useState(true);

  const touchStartX = useRef(null);
  const controlsTimer = useRef(null);

  const count = slides?.length || 0;

  const goTo = useCallback(
    (i) => {
      if (!count) return;
      setIndex(((i % count) + count) % count);
    },
    [count],
  );

  const next = useCallback(() => {
    goTo(index + 1);
  }, [goTo, index]);

  const prev = useCallback(() => {
    goTo(index - 1);
  }, [goTo, index]);


  function getOptimizedImageUrl(url, width = 1200) {
    if (!url || !url.includes("res.cloudinary.com")) {
      return url;
    }

    return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_limit/`);
  }

  /* =========================================================
     SHOW CONTROLS + START HIDE TIMER
  ========================================================= */

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);

    if (controlsTimer.current) {
      clearTimeout(controlsTimer.current);
    }

    controlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, CONTROLS_HIDE_MS);
  }, []);

  /* =========================================================
     CLEANUP CONTROL TIMER
  ========================================================= */

  useEffect(() => {
    return () => {
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
    };
  }, []);

  /* =========================================================
     AUTOPLAY
  ========================================================= */

  useEffect(() => {
    if (count < 2 || paused) return;

    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTOPLAY_MS);

    return () => clearInterval(timer);
  }, [count, paused]);


  /* =========================================================
     KEYBOARD
  ========================================================= */

  const onKeyDown = (e) => {
    resetControlsTimer();

    if (e.key === "ArrowRight") {
      next();
    }

    if (e.key === "ArrowLeft") {
      prev();
    }
  };

  /* =========================================================
     TOUCH
  ========================================================= */

  const onTouchStart = (e) => {
    resetControlsTimer();
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    resetControlsTimer();

    if (touchStartX.current == null) return;

    const delta = e.changedTouches[0].clientX - touchStartX.current;

    if (Math.abs(delta) > 40) {
      delta < 0 ? next() : prev();
    }

    touchStartX.current = null;
  };

  if (!count) return null;

  return (
    <section
      className="hero-slider"
      aria-roledescription="carousel"
      aria-label="Featured offers"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => {
        setPaused(true);
        resetControlsTimer();
      }}
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => {
        setPaused(false);

        if (controlsTimer.current) {
          clearTimeout(controlsTimer.current);
        }

        setShowControls(false);
      }}
      onFocus={() => {
        setPaused(true);
        resetControlsTimer();
      }}
      onBlur={() => {
        setPaused(false);
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        "--hero-transition": `${TRANSITION_MS}ms`,
      }}
    >
      <div className="hero-slider-track">
        {slides.map((slide, i) => {
          const active = i === index;

          const showFallback = !slide.imageUrl || failed[slide._id];

          const hasContent = Boolean(
            slide.heading || slide.description || slide.ctaText,
          );

          return (
            <div
              key={slide._id}
              className={`hero-layer ${active ? "is-active" : ""}`}
              aria-hidden={!active}
            >
              {/* LEFT COLUMN */}
              <div className="hero-text-col">
                {hasContent && (
                  <div className="hero-content-inner">
                    {slide.heading && <h1>{slide.heading}</h1>}

                    {slide.description && <p>{slide.description}</p>}

                    {slide.ctaText && (
                      <Link
                        to={slide.ctaLink || "/products"}
                        className="btn btn-accent hero-cta"
                      >
                        {slide.ctaText}
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN */}
              <div className="hero-image-col">
                {showFallback ? (
                  <div className="hero-image-fallback" aria-hidden="true" />
                ) : (
                  <img
                    className="hero-image"
                    src={getOptimizedImageUrl(slide.imageUrl, 1200)}
                    alt={slide.heading || "Daily Mart Super Market"}
                    decoding="async"
                    style={
                      slide.focalPoint
                        ? {
                            objectPosition: slide.focalPoint,
                          }
                        : undefined
                    }
                    loading={i === 0 ? "eager" : "lazy"}
                    // fetchPriority={i === 0 ? "high" : "auto"}
                    onError={() =>
                      setFailed((f) => ({
                        ...f,
                        [slide._id]: true,
                      }))
                    }
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="hero-torn-edge" aria-hidden="true" />

      {count > 1 && (
        <>
          {/* PREVIOUS */}
          <button
            type="button"
            className={`hero-arrow hero-arrow-prev ${
              showControls ? "controls-visible" : "controls-hidden"
            }`}
            onClick={() => {
              prev();
              resetControlsTimer();
            }}
            aria-label="Previous slide"
          >
            ‹
          </button>

          {/* NEXT */}
          <button
            type="button"
            className={`hero-arrow hero-arrow-next ${
              showControls ? "controls-visible" : "controls-hidden"
            }`}
            onClick={() => {
              next();
              resetControlsTimer();
            }}
            aria-label="Next slide"
          >
            ›
          </button>

          {/* DOTS */}
          <div
            className={`hero-dots ${
              showControls ? "controls-visible" : "controls-hidden"
            }`}
          >
            {slides.map((s, i) => (
              <button
                key={s._id}
                type="button"
                className={`hero-dot ${i === index ? "active" : ""}`}
                onClick={() => {
                  goTo(i);
                  resetControlsTimer();
                }}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
