// src/services/broadcast.service.js
const prisma = require('../config/prisma');

class BroadcastService {
  /**
   * Broadcast a transaction event to the user's configured Group Link URL.
   * Runs asynchronously without blocking the main database transaction.
   *
   * @param {Object} params
   * @param {String} params.userId - Owner of transaction
   * @param {String} params.type - e.g. 'EXPENSE', 'DISTRIBUTOR_PAYMENT', 'CUSTOMER_COLLECTION', 'PURCHASE_BILL', 'BORROWED_MONEY', 'BORROWED_REPAYMENT', 'CASHBOOK', 'BANK_TRANSACTION'
   * @param {Number|String} params.amount - Transaction amount
   * @param {String} [params.partyName] - Lender, Customer, Supplier, Account name
   * @param {String} [params.description] - Description or notes
   * @param {String} [params.paymentMode] - CASH, UPI, CARD, BANK_TRANSFER, etc.
   * @param {String|Date} [params.date] - Transaction date
   * @param {Object} [params.extraDetails] - Any extra key-values
   */
  async broadcastTransaction({
    userId,
    type,
    amount,
    partyName,
    description,
    paymentMode = 'CASH',
    date = new Date(),
    extraDetails = {},
  }) {
    try {
      if (!userId) return;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, groupWebhookUrl: true, autoBroadcastEnabled: true },
      });

      if (!user || !user.autoBroadcastEnabled || !user.groupWebhookUrl?.trim()) {
        return; // Group link not configured or auto broadcast disabled
      }

      const formattedDate = new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const formattedAmount = Number(amount || 0).toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      });

      const typeLabels = {
        EXPENSE: '💸 Expense Logged',
        DISTRIBUTOR_PAYMENT: '🏬 Supplier Payment Made',
        CUSTOMER_COLLECTION: '💵 Customer Credit Collected',
        PURCHASE_BILL: '🧾 New Purchase Bill',
        BORROWED_MONEY: '🤝 Borrowed Money Added (Received)',
        BORROWED_REPAYMENT: '📤 Repayment Paid to Lender',
        CASHBOOK: '📖 CashBook Entry Recorded',
        BANK_TRANSACTION: '🏦 Bank Transaction',
      };

      const title = typeLabels[type] || `🔔 Transaction: ${type}`;

      let message = '';
      if (type === 'CASHBOOK') {
        const ext = extraDetails || {};
        const getVal = (val) => Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
        
        message = `*${title}*\n`;
        message += `------------------------------\n`;
        message += `📅 *Date*: ${formattedDate}\n`;
        message += `📥 *Opening Cash*: ₹${getVal(ext.openingCash)}\n`;
        message += `📈 *Cash Sales*: ₹${getVal(ext.cashSales)}\n`;
        message += `📱 *UPI Receipts*: ₹${getVal(ext.upiReceipts)}\n`;
        message += `💳 *Card Receipts*: ₹${getVal(ext.cardReceipts)}\n`;
        message += `➕ *Other Income*: ₹${getVal(ext.otherIncome)}\n`;
        message += `💸 *Total Expenses*: ₹${getVal(ext.totalExpenses)}\n`;
        message += `🏦 *Bank Deposit*: ₹${getVal(ext.bankDeposit)}\n`;
        message += `🏁 *Closing Cash*: ₹${getVal(ext.closingCash)}\n`;
        
        const diff = Number(ext.cashDifference || 0);
        if (diff !== 0) {
          message += `⚖️ *Cash Difference*: ₹${getVal(diff)}\n`;
        }
        
        if (description) message += `📝 *Notes*: ${description}\n`;
        message += `✨ *Logged By*: ${user.name}\n`;
        message += `------------------------------`;
      } else {
        message = `*${title}*\n`;
        message += `------------------------------\n`;
        message += `💰 *Amount*: ₹${formattedAmount}\n`;
        if (partyName) message += `👤 *Party / Lender / Customer*: ${partyName}\n`;
        message += `📅 *Date*: ${formattedDate}\n`;
        message += `💳 *Mode*: ${paymentMode}\n`;
        if (description) message += `📝 *Notes*: ${description}\n`;

        if (extraDetails.targetDate) {
          message += `⏰ *Reminder / Target Date*: ${new Date(extraDetails.targetDate).toLocaleDateString('en-IN')}\n`;
        }
        if (extraDetails.targetAmount) {
          message += `🎯 *Target Payback Amount*: ₹${Number(extraDetails.targetAmount).toLocaleString('en-IN')}\n`;
        }
        if (extraDetails.remainingBalance !== undefined) {
          message += `⚖️ *Remaining Balance*: ₹${Number(extraDetails.remainingBalance).toLocaleString('en-IN')}\n`;
        }

        message += `✨ *Logged By*: ${user.name}\n`;
        message += `------------------------------`;
      }

      await this._dispatchWebhook(user.groupWebhookUrl.trim(), message, {
        type,
        amount,
        partyName,
        date,
        paymentMode,
        description,
        loggedBy: user.name,
      });
    } catch (err) {
      console.error('[BroadcastService] Error sending transaction broadcast:', err.message);
    }
  }

  /**
   * Test sending a message to a group webhook URL.
   */
  async sendTestBroadcast(url, userName = 'Admin') {
    if (!url?.trim()) {
      throw new Error('Please provide a valid Group Link / Webhook URL.');
    }

    const testMessage = `🚀 *Pharmora Group Broadcaster Connected!*\n------------------------------\n✅ Your group link is working correctly.\n✨ Registered for user: *${userName}*\nEvery transaction logged in Pharmora will be automatically shared to this group.`;

    await this._dispatchWebhook(url.trim(), testMessage, { isTest: true });
    return true;
  }

  /**
   * Helper HTTP dispatcher to handle Telegram, Discord, or generic Webhooks.
   */
  async _dispatchWebhook(webhookUrl, textMessage, rawData = {}) {
    let payload = {};

    if (webhookUrl.includes('callmebot.com')) {
      const encodedMessage = encodeURIComponent(textMessage);
      let targetUrl = webhookUrl;
      if (targetUrl.includes('text=')) {
        targetUrl = targetUrl.replace(/text=[^&]*/, `text=${encodedMessage}`);
      } else {
        targetUrl += (targetUrl.includes('?') ? '&' : '?') + `text=${encodedMessage}`;
      }

      const response = await fetch(targetUrl, { method: 'GET' });
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`CallMeBot API error (${response.status}): ${errorText || response.statusText}`);
      }
      return;
    }

    if (webhookUrl.includes('api.telegram.org')) {
      payload = {
        text: textMessage,
        parse_mode: 'Markdown',
      };
    } else if (webhookUrl.includes('discord.com/api/webhooks')) {
      payload = {
        content: textMessage,
      };
    } else {
      // Standard JSON Webhook
      payload = {
        text: textMessage,
        message: textMessage,
        data: rawData,
        timestamp: new Date().toISOString(),
      };
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Group webhook server returned status ${response.status}: ${errorText || response.statusText}`);
    }
  }
}

module.exports = new BroadcastService();
