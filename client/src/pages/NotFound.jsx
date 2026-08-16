import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container section" style={{ textAlign: "center" }}>
      <h1 style={{ fontSize: 32, marginBottom: 10 }}>Page not found</h1>
      <p style={{ color: "var(--color-text-muted)", marginBottom: 20 }}>
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="btn btn-primary">Back home</Link>
    </div>
  );
}
