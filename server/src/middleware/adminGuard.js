export const adminGuard = (req, res, next) => {
  const role = req.user?.role;
  if (role === "ADMIN") {
    return next();
  }
  return res.status(403).json({
    ok: false,
    code: "FORBIDDEN",
    message: "Administrator role required",
  });
};
