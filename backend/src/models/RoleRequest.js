const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RoleRequest = sequelize.define(
  'RoleRequest',
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
    requested_role: {
      type: DataTypes.ENUM('author'),
      defaultValue: 'author',
      allowNull: false,
    },
    // Optional message from the applicant
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      allowNull: false,
    },
    // Admin who actioned the request
    actioned_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    actioned_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Optional admin note sent alongside decision
    admin_note: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    tableName: 'role_requests',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['user_id', 'status'] },
    ],
  }
);

module.exports = RoleRequest;