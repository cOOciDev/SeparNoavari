import logger from "../utils/logger.js";

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status =
    err.status ||
    err.statusCode ||
    (err.name === "ZodError" ? 422 : err.name === "ValidationError" ? 422 : 500);

  const payload = {
    ok: false,
    code: err.code || "INTERNAL_ERROR",
    message:
      status >= 500
        ? "Internal server error"
        : err.message || "Unexpected error",
  };

  if (err.details) {
    payload.details = err.details;
  }

  if (status >= 500) {
    logger.error("Unhandled error", { err });
  } else {
    logger.warn("Handled error", {
      status,
      message: payload.message,
      path: req.originalUrl,
    });
  }

  res.status(status).json(payload);
};

export default errorHandler;
