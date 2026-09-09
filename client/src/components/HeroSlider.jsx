import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import "./HeroSlider.css";

const AUTOPLAY_MS = 4000;
const TRANSITION_MS = 900;
const CONTROLS_HIDE_MS = 3000;
const SWIPE_THRESHOLD = 40;

const DEFAULT_ALT = "Daily Mart Super Market";

/* ============================================================
   IMAGE HELPERS
============================================================ */

function getOptimizedImageUrl(url, width = 1200) {
  if (!url || !url.includes("res.cloudinary.com")) {
    return url;
  }

  return url.replace(
    "/upload/",
    `/upload/f_auto,q_auto,w_${width},c_limit/`,
  );
}

/* ============================================================
   HERO SLIDER
============================================================ */

export default function HeroSlider({ slides }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState({});
  const [showControls, setShowControls] =
    useState(true);

  const touchStartX = useRef(null);
  const controlsTimer = useRef(null);

  const count = slides?.length || 0;

  /* ==========================================================
     NAVIGATION
  ========================================================== */

  const goTo = useCallback(
    (targetIndex) => {
      if (!count) return;

      setIndex(
        ((targetIndex % count) + count) %
          count,
      );
    },
    [count],
  );

  const next = useCallback(() => {
    setIndex((currentIndex) => {
      if (!count) return 0;

      return (currentIndex + 1) % count;
    });
  }, [count]);

  const prev = useCallback(() => {
    setIndex((currentIndex) => {
      if (!count) return 0;

      return (
        (currentIndex - 1 + count) % count
      );
    });
  }, [count]);

  /* ==========================================================
     CONTROLS TIMER
  ========================================================== */

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);

    if (controlsTimer.current) {
      clearTimeout(controlsTimer.current);
    }

    controlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, CONTROLS_HIDE_MS);
  }, []);

  /* ==========================================================
     TIMER CLEANUP
  ========================================================== */

  useEffect(() => {
    return () => {
      if (controlsTimer.current) {
        clearTimeout(
          controlsTimer.current,
        );
      }
    };
  }, []);

  /* ==========================================================
     KEEP INDEX VALID
  ========================================================== */

  useEffect(() => {
    if (!count) {
      setIndex(0);
      return;
    }

    setIndex((currentIndex) =>
      currentIndex >= count
        ? 0
        : currentIndex,
    );
  }, [count]);

  /* ==========================================================
     AUTOPLAY
  ========================================================== */

  useEffect(() => {
    if (count < 2 || paused) {
      return;
    }

    const timer = setInterval(() => {
      setIndex((currentIndex) =>
        (currentIndex + 1) % count,
      );
    }, AUTOPLAY_MS);

    return () => clearInterval(timer);
  }, [count, paused]);

  /* ==========================================================
     KEYBOARD
  ========================================================== */

  const onKeyDown = useCallback(
    (event) => {
      resetControlsTimer();

      if (event.key === "ArrowRight") {
        next();
      } else if (event.key === "ArrowLeft") {
        prev();
      }
    },
    [
      next,
      prev,
      resetControlsTimer,
    ],
  );

  /* ==========================================================
     TOUCH
  ========================================================== */

  const onTouchStart = useCallback(
    (event) => {
      resetControlsTimer();

      touchStartX.current =
        event.touches[0]?.clientX ?? null;
    },
    [resetControlsTimer],
  );

  const onTouchEnd = useCallback(
    (event) => {
      resetControlsTimer();

      if (
        touchStartX.current === null
      ) {
        return;
      }

      const endX =
        event.changedTouches[0]?.clientX;

      if (endX === undefined) {
        touchStartX.current = null;
        return;
      }

      const delta =
        endX - touchStartX.current;

      if (
        Math.abs(delta) >
        SWIPE_THRESHOLD
      ) {
        if (delta < 0) {
          next();
        } else {
          prev();
        }
      }

      touchStartX.current = null;
    },
    [
      next,
      prev,
      resetControlsTimer,
    ],
  );

  /* ==========================================================
     NO SLIDES
  ========================================================== */

  if (!count) {
    return null;
  }

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
          clearTimeout(
            controlsTimer.current,
          );
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
      {/* ======================================================
          SLIDES
      ====================================================== */}

      <div className="hero-slider-track">
        {slides.map((slide, slideIndex) => {
          const active =
            slideIndex === index;

          const showFallback =
            !slide.imageUrl ||
            failed[slide._id];

          const hasContent = Boolean(
            slide.heading ||
              slide.description ||
              slide.ctaText,
          );

          return (
            <div
              key={slide._id}
              className={`hero-layer ${active ? "is-active" : ""}`}
              aria-hidden={!active}
            >
              {/* ==================================================
                  LEFT COLUMN
              ================================================== */}

              <div className="hero-text-col">
                {hasContent && (
                  <div className="hero-content-inner">
                    {slide.heading &&
                      (slideIndex === 0 ? (
                        <h1>{slide.heading}</h1>
                      ) : (
                        <h2>{slide.heading}</h2>
                      ))}

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

              {/* ==================================================
                  RIGHT COLUMN
              ================================================== */}

              <div className="hero-image-col">
                {showFallback ? (
                  <div className="hero-image-fallback" aria-hidden="true" />
                ) : (
                  <img
                    className="hero-image"
                    src={getOptimizedImageUrl(slide.imageUrl, 1200)}
                    alt={slide.heading || DEFAULT_ALT}
                    decoding="async"
                    style={
                      slide.focalPoint
                        ? {
                            objectPosition: slide.focalPoint,
                          }
                        : undefined
                    }
                    loading={slideIndex === 0 ? "eager" : "lazy"}
                    onError={() => {
                      setFailed((current) => ({
                        ...current,
                        [slide._id]: true,
                      }));
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================
          TORN EDGE
      ======================================================== */}

      <div
        className="hero-torn-edge"
        aria-hidden="true"
      />

      {/* ========================================================
          CONTROLS
      ======================================================== */}

      {count > 1 && (
        <>
          {/* PREVIOUS */}

          <button
            type="button"
            className={`hero-arrow hero-arrow-prev ${
              showControls
                ? "controls-visible"
                : "controls-hidden"
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
              showControls
                ? "controls-visible"
                : "controls-hidden"
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
              showControls
                ? "controls-visible"
                : "controls-hidden"
            }`}
          >
            {slides.map(
              (slide, slideIndex) => (
                <button
                  key={slide._id}
                  type="button"
                  className={`hero-dot ${
                    slideIndex === index
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    goTo(slideIndex);
                    resetControlsTimer();
                  }}
                  aria-label={`Go to slide ${
                    slideIndex + 1
                  }`}
                  aria-current={
                    slideIndex === index
                      ? "true"
                      : undefined
                  }
                />
              ),
            )}
          </div>
        </>
      )}
    </section>
  );
}
