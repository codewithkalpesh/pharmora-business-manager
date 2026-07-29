const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

class TelegramService {
  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    if (!this.token) {
      console.warn('[TelegramService] TELEGRAM_BOT_TOKEN is not configured. Telegram messages will not be sent.');
      this.client = null;
      return;
    }
    this.client = new TelegramBot(this.token, { polling: false });
    this.groupId = process.env.TELEGRAM_GROUP_CHAT_ID;
    if (!this.groupId) {
      console.warn('[TelegramService] TELEGRAM_GROUP_CHAT_ID is not configured. Telegram group uploads disabled.');
    }
  }

  async sendMessage(text) {
    if (!this.client || !this.groupId) return false;
    try {
      await this.client.sendMessage(this.groupId, text, { parse_mode: 'Markdown' });
      return true;
    } catch (err) {
      console.error('[TelegramService] sendMessage failed:', err.message);
      throw new ApiError(500, 'Failed to send Telegram message.');
    }
  }

  async sendDocument(filePath, caption) {
    if (!this.client || !this.groupId) return false;
    if (!fs.existsSync(filePath)) {
      throw new ApiError(404, 'PDF report file not found.');
    }

    try {
      await this.client.sendDocument(this.groupId, filePath, { caption, parse_mode: 'Markdown' });
      return true;
    } catch (err) {
      console.error('[TelegramService] sendDocument failed:', err.message);
      throw new ApiError(500, 'Failed to send Telegram document.');
    }
  }
}

module.exports = new TelegramService();