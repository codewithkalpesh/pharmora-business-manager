// src/services/auth.service.js
const bcrypt = require('bcrypt');
const ApiError = require('../utils/ApiError');
const { generateTokenPair } = require('../utils/token');
const authRepo = require('../repositories/auth.repository');

const SALT_ROUNDS = 12;

const register = async ({ name, email, password, role }) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const existing = await authRepo.findUserByEmail(normalizedEmail);
  if (existing) throw new ApiError(409, 'An account with this email already exists.');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await authRepo.createUser({ name, email: normalizedEmail, passwordHash, role });
  return user;
};

const login = async ({ email, password }) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const user = await authRepo.findUserByEmail(normalizedEmail);
  if (!user) throw new ApiError(401, 'Invalid email or password.');
  if (!user.isActive) throw new ApiError(403, 'Your account has been deactivated. Contact owner.');

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new ApiError(401, 'Invalid email or password.');

  const tokens = generateTokenPair(user);
  await authRepo.updateRefreshToken(user.id, tokens.refreshToken);

  const { passwordHash, refreshToken, ...safeUser } = user;
  return { user: safeUser, ...tokens };
};

const logout = async (userId) => {
  await authRepo.updateRefreshToken(userId, null);
};

const refresh = async (refreshToken) => {
  const { verifyRefreshToken } = require('../utils/token');

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token.');
  }

  const user = await authRepo.findUserByRefreshToken(refreshToken);
  if (!user) throw new ApiError(401, 'Refresh token not found. Please login again.');
  if (!user.isActive) throw new ApiError(403, 'Your account has been deactivated. Contact owner.');

  const tokens = generateTokenPair(user);
  await authRepo.updateRefreshToken(user.id, tokens.refreshToken);
  return tokens;
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const userRecord = await authRepo.findUserById(userId);
  if (!userRecord) throw new ApiError(404, 'User not found.');

  const user = await authRepo.findUserByEmail(userRecord.email);
  if (!user) throw new ApiError(404, 'User not found.');

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) throw new ApiError(400, 'Current password is incorrect.');

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await authRepo.updatePassword(userId, newHash);
  await authRepo.updateRefreshToken(userId, null); // invalidate all sessions
};

const getProfile = async (userId) => {
  const user = await authRepo.findUserById(userId);
  if (!user) throw new ApiError(404, 'User not found.');
  return user;
};

module.exports = { register, login, logout, refresh, changePassword, getProfile };
