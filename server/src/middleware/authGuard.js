export const authGuard = (req, res, next) => {
  if (req.isAuthenticated?.() && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({
    ok: false,
    code: "UNAUTHENTICATED",
    message: "Authentication required",
  });
};
