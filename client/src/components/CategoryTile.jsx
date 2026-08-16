import { Link } from "react-router-dom";
import "./CategoryTile.css";

export default function CategoryTile({ category }) {
  return (
    <Link to={`/products?category=${category._id}`} className="category-tile">
      <div className="category-tile-image">
        {category.imageUrl ? (
          <img src={category.imageUrl} alt={category.name} loading="lazy" />
        ) : (
          <span className="category-tile-initial">{category.name.charAt(0)}</span>
        )}
      </div>
      <span className="category-tile-name">{category.name}</span>
    </Link>
  );
}
