const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Highlight = sequelize.define(
  'Highlight',
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
    selected_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    page_number: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    // @react-pdf-viewer highlight plugin shape:
    // { boundingRect: { x1, y1, x2, y2, width, height }, rects: [...], pageIndex: number }
    position_data: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    // Which AI action triggered this highlight: 'summarize' | 'synonyms'
    ai_action: {
      type: DataTypes.ENUM('summarize', 'synonyms'),
      allowNull: false,
    },
    // The LLM result stored alongside the highlight for the sidebar
    ai_result: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
  },
  {
    tableName: 'highlights',
    indexes: [
      { fields: ['user_id', 'book_id'] },
      { fields: ['user_id'] },
    ],
  }
);

module.exports = Highlight;