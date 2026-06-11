const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserHistory = sequelize.define(
  'UserHistory',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    book_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    last_page: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 1,
      allowNull: false,
    },
    // 0.00 → 100.00, computed as (last_page / total_pages) * 100
    completion_pct: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.0,
    },
    last_read_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'user_history',
    indexes: [
      { unique: true, fields: ['user_id', 'book_id'] },
      { fields: ['user_id', 'last_read_at'] },
    ],
  }
);

module.exports = UserHistory;