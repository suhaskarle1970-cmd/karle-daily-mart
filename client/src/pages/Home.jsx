import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import HeroSlider from "../components/HeroSlider";
import ProductCard from "../components/ProductCard";
import CategoryTile from "../components/CategoryTile";
import { LoadingGrid, ErrorState } from "../components/States";
import { useDepartments } from "../hooks/useDepartments";
import "./Home.css";

export default function Home() {
  const { departments } = useDepartments();
  const [slides, setSlides] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    load();
  }, []);

  function load() {
    setStatus("loading");
    Promise.all([
      api.get("/sliders"),
      api.get("/categories"),
      api.get("/products", { params: { limit: 8 } }),
    ])
      .then(([sliderRes, catRes, prodRes]) => {
        setSlides(sliderRes.data.sliders);
        setCategories(catRes.data.categories);
        setFeatured(prodRes.data.products);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }

  if (status === "error") {
    return (
      <div className="container">
        <ErrorState message="Couldn't load the store right now." onRetry={load} />
      </div>
    );
  }

  const categoriesByDepartment = departments
    .map((dept) => ({
      ...dept,
      categories: categories.filter((c) => c.department === dept.id),
    }))
    .filter((dept) => dept.categories.length > 0);

  return (
    <>
      {status === "ready" && <HeroSlider slides={slides} />}

      <section className="container section">
        <div className="section-heading">
          <h2>Featured products</h2>
          <Link to="/products" className="section-link">
            View all →
          </Link>
        </div>
        {status === "loading" ? (
          <LoadingGrid count={8} />
        ) : (
          <div className="product-grid">
            {featured.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>

      {status === "loading" &&
        Array.from({ length: 2 }).map((_, i) => (
          <section key={i} className="container section department-section">
            <div className="skeleton-line" style={{ width: 180, height: 22, marginBottom: 16 }} />
            <div className="category-tile-row">
              {Array.from({ length: 6 }).map((__, j) => (
                <div key={j} className="skeleton-img" style={{ width: 76, height: 76, borderRadius: "50%" }} />
              ))}
            </div>
          </section>
        ))}

      {status === "ready" &&
        categoriesByDepartment.map((dept) => (
          <section key={dept.id} className="container section department-section">
            <div className="section-heading">
              <h2>{dept.label}</h2>
            </div>
            <div className="category-tile-row">
              {dept.categories.map((c) => (
                <CategoryTile key={c._id} category={c} />
              ))}
            </div>
          </section>
        ))}

      {status === "ready" && categoriesByDepartment.length === 0 && categories.length > 0 && (
        <section className="container section">
          <div className="section-heading">
            <h2>Shop by category</h2>
          </div>
          <div className="category-tile-row" style={{ flexWrap: "wrap" }}>
            {categories.map((c) => (
              <CategoryTile key={c._id} category={c} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
