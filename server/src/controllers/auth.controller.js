// src/controllers/auth.controller.js
const authService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
};

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    return res.status(201).json(new ApiResponse(201, { user }, 'Account created successfully.'));
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);

    res
      .cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 30 * 24 * 60 * 60 * 1000 })
      .cookie('refreshToken', refreshToken, { ...COOKIE_OPTIONS, maxAge: 180 * 24 * 60 * 60 * 1000 });

    return res.status(200).json(new ApiResponse(200, { user, accessToken, refreshToken }, 'Login successful.'));
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    res.clearCookie('accessToken').clearCookie('refreshToken');
    return res.status(200).json(new ApiResponse(200, {}, 'Logged out successfully.'));
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken || req.headers?.['x-refresh-token'];
    if (!token) throw new ApiError(401, 'Refresh token not provided.');

    const { accessToken, refreshToken: newRefreshToken } = await authService.refresh(token);

    res
      .cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 30 * 24 * 60 * 60 * 1000 })
      .cookie('refreshToken', newRefreshToken, { ...COOKIE_OPTIONS, maxAge: 180 * 24 * 60 * 60 * 1000 });

    return res.status(200).json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, 'Token refreshed.'));
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    return res.status(200).json(new ApiResponse(200, { user }));
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req.user.id, req.body);
    res.clearCookie('accessToken').clearCookie('refreshToken');
    return res.status(200).json(new ApiResponse(200, {}, 'Password changed. Please login again.'));
  } catch (err) {
    next(err);
  }
};

const updateGroupWebhook = async (req, res, next) => {
  try {
    const updated = await authService.updateGroupWebhook(req.user.id, req.body);
    return res.status(200).json(new ApiResponse(200, updated, 'Group link settings updated.'));
  } catch (err) {
    next(err);
  }
};

const testGroupWebhook = async (req, res, next) => {
  try {
    await authService.testGroupWebhook(req.user.id, req.body?.groupWebhookUrl);
    return res.status(200).json(new ApiResponse(200, {}, 'Test broadcast sent successfully!'));
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, refreshToken, getProfile, changePassword, updateGroupWebhook, testGroupWebhook };
