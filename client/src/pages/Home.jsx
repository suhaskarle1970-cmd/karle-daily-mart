import { useEffect, useState } from "react";
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
    label: "stationery",
    sublabel: "Pens, Pencils, NoteBooks & office supplies",
    Icon: HistoryEduIcon,
    theme: "stationery",
  },
];

export default function Home() {
  const [slides, setSlides] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [departmentProducts, setDepartmentProducts] = useState({});
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    load();
  }, []);

  async function load() {
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
      console.error(error);
      setStatus("error");
    }
  }

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
                <div className="dept-icon-wrap dept-icon-skeleton" />

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

          /*
          Don't show empty departments.
        */
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
                  {/* Icon */}
                  <div className="dept-icon-wrap">
                    <Icon
                      className="dept-icon"
                      fontSize="medium"
                      aria-hidden="true"
                    />
                  </div>

                  {/* Title + subtitle */}
                  <div className="dept-heading-text">
                    <h2 className="dept-label">{department.label}</h2>

                    <div className="dept-sublabel">{department.sublabel}</div>
                  </div>
                </div>

                {/* View all */}
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
