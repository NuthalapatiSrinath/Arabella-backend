// src/middleware/admin.js
export const isAdmin = (req, res, next) => {
  // req.user is populated by the 'authenticate' middleware
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Admin privileges required.",
  });
};
