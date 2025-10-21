export const judgeGuard = (req, res, next) => {
  const role = req.user?.role;
  if (role === "JUDGE" || role === "ADMIN") {
    return next();
  }
  return res.status(403).json({
    ok: false,
    code: "FORBIDDEN",
    message: "Judge role required",
  });
};
