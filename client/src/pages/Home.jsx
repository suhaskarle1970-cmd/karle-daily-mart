import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import HeroSlider from "../components/HeroSlider";
import ProductCard from "../components/ProductCard";
import { LoadingGrid, ErrorState } from "../components/States";

import LocalGroceryStoreIcon from "@mui/icons-material/LocalGroceryStore";
import EmojiFoodBeverageIcon from "@mui/icons-material/EmojiFoodBeverage";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import SpaIcon from "@mui/icons-material/Spa";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";

import "./Home.css";

/* =========================================================
   DEPARTMENTS
========================================================= */

const DEPARTMENTS = [
  {
    id: "grocery-kitchen",
    label: "Grocery & Kitchen",
    sublabel: "Rice, dal, spices, oils & more",
    Icon: LocalGroceryStoreIcon,
    theme: "grocery",
  },
  {
    id: "snacks-drinks",
    label: "Snacks & Drinks",
    sublabel: "Chips, biscuits, juices & beverages",
    Icon: EmojiFoodBeverageIcon,
    theme: "snacks",
  },
  {
    id: "beauty-personal-care",
    label: "Beauty & Personal Care",
    sublabel: "Skincare, haircare & grooming",
    Icon: SpaIcon,
    theme: "beauty",
  },
  {
    id: "household-essentials",
    label: "Household Essentials",
    sublabel: "Cleaners, detergents & home care",
    Icon: CleaningServicesIcon,
    theme: "household",
  },
  {
    id: "stationery",
    label: "Stationery",
    sublabel: "Pens, pencils, notebooks & office supplies",
    Icon: HistoryEduIcon,
    theme: "stationery",
  },
];

/* =========================================================
   HOME PAGE
========================================================= */

export default function Home() {
  const [slides, setSlides] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [departmentProducts, setDepartmentProducts] = useState({});
  const [status, setStatus] = useState("loading");

  /* =========================================================
     LOAD HOMEPAGE DATA
  ========================================================= */

  const load = useCallback(async () => {
    setStatus("loading");

    try {
      const [sliderRes, homepageRes] = await Promise.all([
        api.get("/sliders"),
        api.get("/products/homepage"),
      ]);

      setSlides(sliderRes.data.sliders || []);
      setFeatured(homepageRes.data.featured || []);
      setDepartmentProducts(homepageRes.data.departments || {});

      setStatus("ready");
    } catch (error) {
      console.error("Failed to load homepage:", error);
      setStatus("error");
    }
  }, []);

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    load();
  }, [load]);

  /* =========================================================
     HOMEPAGE SEO
  ========================================================= */

  useEffect(() => {
    const title = "Daily Mart Super Market | Online Grocery Shopping";

    const description =
      "Shop grocery, kitchen essentials, snacks, drinks, beauty products, household essentials and stationery at Daily Mart Super Market.";

    const siteUrl = "https://www.dailymartsupermarket.in/";

    // ---------------------------------------------------------
    // PAGE TITLE
    // ---------------------------------------------------------

    document.title = title;

    // ---------------------------------------------------------
    // META DESCRIPTION
    // ---------------------------------------------------------

    let metaDescription = document.querySelector('meta[name="description"]');

    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }

    metaDescription.setAttribute("content", description);

    // ---------------------------------------------------------
    // CANONICAL
    // ---------------------------------------------------------

    let canonical = document.querySelector('link[rel="canonical"]');

    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }

    canonical.setAttribute("href", siteUrl);

    // ---------------------------------------------------------
    // OPEN GRAPH
    // ---------------------------------------------------------

    const setMetaProperty = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`);

      if (!meta) {
        meta = document.createElement("meta");

        meta.setAttribute("property", property);

        document.head.appendChild(meta);
      }

      meta.setAttribute("content", content);
    };

    setMetaProperty("og:title", title);

    setMetaProperty("og:description", description);

    setMetaProperty("og:url", siteUrl);

    setMetaProperty("og:type", "website");

    // ---------------------------------------------------------
    // ORGANIZATION SCHEMA
    // ---------------------------------------------------------

    const existingSchema = document.getElementById("organization-jsonld");

    if (existingSchema) {
      existingSchema.remove();
    }

    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Daily Mart Super Market",
      url: siteUrl,
    };

    const script = document.createElement("script");

    script.id = "organization-jsonld";

    script.type = "application/ld+json";

    script.textContent = JSON.stringify(organizationSchema);

    document.head.appendChild(script);

    // ---------------------------------------------------------
    // CLEANUP
    // ---------------------------------------------------------

    return () => {
      const schema = document.getElementById("organization-jsonld");

      if (schema) {
        schema.remove();
      }
    };
  }, []);

  /* =========================================================
     ERROR STATE
  ========================================================= */

  if (status === "error") {
    return (
      <div className="container">
        <ErrorState
          message="Couldn't load the store right now."
          onRetry={load}
        />
      </div>
    );
  }

  return (
    <>
      {/* =====================================================
          HERO
      ===================================================== */}

      {status === "ready" && <HeroSlider slides={slides} />}

      {/* =====================================================
          FEATURED PRODUCTS
      ===================================================== */}

      <section className="container section featured-section">
        <div className="section-heading featured-heading">
          <div className="featured-title-wrap">
            <span className="section-eyebrow">Popular Picks</span>

            <h2>Featured Products</h2>

            <p>Popular products customers love</p>
          </div>

          <Link to="/products" className="section-link">
            View all →
          </Link>
        </div>

        {status === "loading" ? (
          <LoadingGrid count={6} />
        ) : (
          <div className="product-grid featured-grid">
            {featured.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          DEPARTMENT SECTIONS - LOADING
      ===================================================== */}

      {status === "loading" &&
        DEPARTMENTS.map((department) => (
          <section
            key={department.id}
            className={`container section dept-section dept-${department.theme}`}
          >
            <div className="dept-heading">
              <div className="dept-heading-left">
                <div
                  className="dept-icon-wrap dept-icon-skeleton"
                  aria-hidden="true"
                />

                <div className="dept-heading-text">
                  <div
                    className="skeleton-line"
                    style={{
                      width: 200,
                      height: 20,
                    }}
                  />

                  <div
                    className="skeleton-line"
                    style={{
                      width: 140,
                      height: 13,
                      marginTop: 6,
                    }}
                  />
                </div>
              </div>

              <div
                className="skeleton-line"
                style={{
                  width: 80,
                  height: 32,
                  borderRadius: 999,
                }}
              />
            </div>

            <LoadingGrid count={4} />
          </section>
        ))}

      {/* =====================================================
          DEPARTMENT SECTIONS - PRODUCTS
      ===================================================== */}

      {status === "ready" &&
        DEPARTMENTS.map((department) => {
          const products = departmentProducts[department.id] || [];

          // Don't render empty departments.
          if (products.length === 0) {
            return null;
          }

          const Icon = department.Icon;

          return (
            <section
              key={department.id}
              className={`container section dept-section dept-${department.theme}`}
            >
              {/* =================================================
                  DEPARTMENT HEADER
              ================================================= */}

              <div className="dept-heading">
                <div className="dept-heading-left">
                  {/* ICON */}

                  <div className="dept-icon-wrap">
                    <Icon
                      className="dept-icon"
                      fontSize="medium"
                      aria-hidden="true"
                    />
                  </div>

                  {/* TITLE + SUBTITLE */}

                  <div className="dept-heading-text">
                    <h2 className="dept-label">{department.label}</h2>

                    <div className="dept-sublabel">{department.sublabel}</div>
                  </div>
                </div>

                {/* VIEW ALL */}

                <Link
                  to={`/products?department=${department.id}`}
                  className="dept-link"
                >
                  View all →
                </Link>
              </div>

              {/* =================================================
                  DEPARTMENT PRODUCTS
              ================================================= */}

              <div className="product-grid dept-product-grid">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </section>
          );
        })}
    </>
  );
}
