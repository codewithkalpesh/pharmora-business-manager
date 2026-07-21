// src/repositories/expense.repository.js
const prisma = require('../config/prisma');

class ExpenseRepository {
  // Expense operations
  async createExpense(data) {
    return prisma.expense.create({
      data,
      include: {
        category: true,
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async findExpenses(params = {}) {
    const { skip, take, where, orderBy } = params;
    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        skip,
        take,
        where,
        orderBy,
        include: { category: true },
      }),
      prisma.expense.count({ where }),
    ]);
    return { expenses, total };
  }

  async findExpenseById(id) {
    return prisma.expense.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  async updateExpense(id, data) {
    return prisma.expense.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async deleteExpense(id) {
    return prisma.expense.delete({
      where: { id },
    });
  }

  // Category operations
  async findCategories() {
    return prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(data) {
    return prisma.expenseCategory.create({
      data,
    });
  }

  async findCategoryByName(name) {
    return prisma.expenseCategory.findUnique({
      where: { name },
    });
  }

  async seedDefaultCategories(categories) {
    for (const cat of categories) {
      await prisma.expenseCategory.upsert({
        where: { name: cat.name },
        update: {},
        create: cat,
      });
    }
  }

  // Aggregate stats
  async sumExpensesGroupedByCategory(whereClause = {}) {
    const aggregations = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: whereClause,
      _sum: {
        amount: true,
      },
    });

    // Populate category metadata for response
    const categories = await this.findCategories();
    return aggregations.map((agg) => {
      const cat = categories.find((c) => c.id === agg.categoryId);
      return {
        categoryId: agg.categoryId,
        name: cat ? cat.name : 'Unknown',
        color: cat ? cat.color : '#64748b',
        value: Number(agg._sum.amount),
      };
    });
  }
}

module.exports = new ExpenseRepository();
