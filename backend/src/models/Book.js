const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Book = sequelize.define(
  'Book',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    author_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { len: [1, 255] },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    genre: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    // Relative path from UPLOAD_DIR, e.g. "books/uuid.pdf"
    file_path: {
      type: DataTypes.STRING(512),
      allowNull: false,
    },
    // Relative path from UPLOAD_DIR, e.g. "covers/uuid.jpg"
    cover_path: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    file_size_bytes: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    total_pages: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    visibility: {
      type: DataTypes.ENUM('private', 'public'),
      defaultValue: 'private',
      allowNull: false,
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'books',
    indexes: [
      { fields: ['author_id'] },
      { fields: ['visibility', 'is_published'] },
      { fields: ['genre'] },
    ],
  }
);

module.exports = Book;