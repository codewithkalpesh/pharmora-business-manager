// src/repositories/auth.repository.js
const prisma = require('../config/prisma');

const findUserByEmail = (email) =>
  prisma.user.findUnique({ where: { email } });

const findUserById = (id) =>
  prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });

const createUser = ({ name, email, passwordHash, role }) =>
  prisma.user.create({
    data: { name, email, passwordHash, role: role || 'STAFF' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

const updateRefreshToken = (id, refreshToken) =>
  prisma.user.update({ where: { id }, data: { refreshToken } });

const updatePassword = (id, passwordHash) =>
  prisma.user.update({ where: { id }, data: { passwordHash } });

const findUserByRefreshToken = (refreshToken) =>
  prisma.user.findFirst({ where: { refreshToken } });

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateRefreshToken,
  updatePassword,
  findUserByRefreshToken,
};
