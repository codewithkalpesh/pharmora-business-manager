// src/middlewares/role.middleware.js
const ApiError = require('../utils/ApiError');

// Role hierarchy: OWNER > MANAGER > ACCOUNTANT > STAFF
const ROLE_HIERARCHY = {
  OWNER: 4,
  MANAGER: 3,
  ACCOUNTANT: 2,
  STAFF: 1,
};

/**
 * Require specific roles to access a route.
 * Pass the minimum role required (or an array of allowed roles).
 *
 * Usage:
 *   router.get('/admin', authenticate, requireRole('OWNER'), handler)
 *   router.get('/reports', authenticate, requireRole(['OWNER', 'ACCOUNTANT']), handler)
 */
const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Access denied. Required role: ${allowedRoles.join(' or ')}`)
      );
    }

    next();
  };
};

/**
 * Require a minimum role level.
 * e.g., requireMinRole('ACCOUNTANT') allows ACCOUNTANT, MANAGER, OWNER
 */
const requireMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

    if (userLevel < requiredLevel) {
      return next(
        new ApiError(403, `Access denied. Minimum required role: ${minRole}`)
      );
    }

    next();
  };
};

module.exports = { requireRole, requireMinRole };
