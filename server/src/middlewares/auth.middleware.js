// src/middlewares/auth.middleware.js
const { verifyAccessToken } = require('../utils/token');
const ApiError = require('../utils/ApiError');
const prisma = require('../config/prisma');

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(401, 'Authentication required. Please login.');
    }

    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new ApiError(401, 'User not found or account deactivated.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid token. Please login again.'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token expired. Please refresh your session.'));
    }
    next(error);
  }
};

module.exports = { authenticate };
