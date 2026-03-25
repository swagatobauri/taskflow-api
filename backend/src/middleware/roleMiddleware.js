/**
 * Returns middleware that allows access only if req.user.role is in the allowed list.
 * Usage: router.get('/admin', authMiddleware, checkRole('admin'), handler)
 */
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    next();
  };
};

module.exports = { checkRole };
