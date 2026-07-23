// src/repositories/cashbook.repository.js
const prisma = require('../config/prisma');

class CashBookRepository {
  async create(data) {
    return prisma.cashBook.create({
      data,
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });
  }

  async findAll(params = {}) {
    const { skip, take, orderBy, where } = params;
    
    const [entries, total] = await Promise.all([
      prisma.cashBook.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
        },
      }),
      prisma.cashBook.count({ where }),
    ]);

    return { entries, total };
  }

  async findById(id) {
    return prisma.cashBook.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });
  }

  async findByDate(date, userId) {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return prisma.cashBook.findFirst({
      where: {
        createdById: userId,
        date: { gte: startOfDay, lte: endOfDay }
      },
    });
  }

  async findPreviousEntry(date, userId) {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    return prisma.cashBook.findFirst({
      where: {
        date: { lt: startOfDay },
        createdById: userId,
      },
      orderBy: { date: 'desc' },
    });
  }

  async update(id, data) {
    return prisma.cashBook.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });
  }

  async delete(id) {
    return prisma.cashBook.delete({
      where: { id },
    });
  }
}

module.exports = new CashBookRepository();
