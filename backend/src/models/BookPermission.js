const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BookPermission = sequelize.define(
  'BookPermission',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    book_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    // 'read' = can view, 'manage' = can edit metadata / toggle publish
    permission_type: {
      type: DataTypes.ENUM('read', 'manage'),
      defaultValue: 'read',
      allowNull: false,
    },
    granted_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'book_permissions',
    indexes: [
      { unique: true, fields: ['book_id', 'user_id'] },
      { fields: ['user_id'] },
    ],
  }
);

module.exports = BookPermission;