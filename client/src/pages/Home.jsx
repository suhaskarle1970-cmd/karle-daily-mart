import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import HeroSlider from "../components/HeroSlider";
import ProductCard from "../components/ProductCard";
import { LoadingGrid, ErrorState } from "../components/States";
import "./Home.css";

const DEPARTMENTS = [
  {
    id: "grocery-kitchen",
    label: "Grocery & Kitchen",
  },
  {
    id: "snacks-drinks",
    label: "Snacks & Drinks",
  },
  {
    id: "beauty-personal-care",
    label: "Beauty & Personal Care",
  },
  {
    id: "household-essentials",
    label: "Household Essentials",
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
      {status === "ready" && <HeroSlider slides={slides} />}

      {/* FEATURED PRODUCTS */}
      <section className="container section">
        <div className="section-heading">
          <h2>Featured Products</h2>

          <Link to="/products" className="section-link">
            View all →
          </Link>
        </div>

        {status === "loading" ? (
          <LoadingGrid count={6} />
        ) : (
          <div className="product-grid">
            {featured.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* DEPARTMENT SECTIONS */}
      {status === "loading" &&
        DEPARTMENTS.map((department) => (
          <section
            key={department.id}
            className="container section department-section"
          >
            <div
              className="skeleton-line"
              style={{
                width: 220,
                height: 22,
                marginBottom: 16,
              }}
            />

            <LoadingGrid count={4} />
          </section>
        ))}

      {status === "ready" &&
        DEPARTMENTS.map((department) => {
          const products = departmentProducts[department.id] || [];

          if (products.length === 0) {
            return null;
          }

          return (
            <section
              key={department.id}
              className="container section department-section"
            >
              <div className="section-heading">
                <h2>{department.label}</h2>

                <Link
                  to={`/products?department=${department.id}`}
                  className="section-link"
                >
                  View all →
                </Link>
              </div>

              <div className="product-grid">
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
