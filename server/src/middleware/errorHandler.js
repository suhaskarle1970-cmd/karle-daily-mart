export function notFound(req, res) {
  res.status(404).json({ message: "Route not found." });
}

// Centralized error handler — keeps stack traces out of production responses.
export function errorHandler(err, req, res, _next) {
  console.error("[error]", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed.",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({ message: `That ${field} is already in use.` });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid identifier." });
  }

  const status = err.status || 500;
  const message =
    status === 500 && process.env.NODE_ENV === "production"
      ? "Something went wrong. Please try again."
      : err.message || "Something went wrong.";

  res.status(status).json({ message });
}
