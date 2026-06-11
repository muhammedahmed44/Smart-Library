const sequelize = require('../config/database');

const User          = require('./User');
const Book          = require('./Book');
const BookPermission = require('./BookPermission');
const UserHistory   = require('./UserHistory');
const Highlight     = require('./Highlight');
const Recommendation = require('./Recommendation');
const RoleRequest   = require('./RoleRequest');

// ─── User ↔ Book ───────────────────────────────────────────
User.hasMany(Book, { foreignKey: 'author_id', as: 'authoredBooks', onDelete: 'CASCADE' });
Book.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

// ─── Book ↔ BookPermission ─────────────────────────────────
Book.hasMany(BookPermission, { foreignKey: 'book_id', as: 'permissions', onDelete: 'CASCADE' });
BookPermission.belongsTo(Book, { foreignKey: 'book_id', as: 'book' });

User.hasMany(BookPermission, { foreignKey: 'user_id', as: 'bookPermissions', onDelete: 'CASCADE' });
BookPermission.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ─── User ↔ UserHistory ────────────────────────────────────
User.hasMany(UserHistory, { foreignKey: 'user_id', as: 'history', onDelete: 'CASCADE' });
UserHistory.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Book.hasMany(UserHistory, { foreignKey: 'book_id', as: 'readHistory', onDelete: 'CASCADE' });
UserHistory.belongsTo(Book, { foreignKey: 'book_id', as: 'book' });

// ─── User ↔ Highlight ──────────────────────────────────────
User.hasMany(Highlight, { foreignKey: 'user_id', as: 'highlights', onDelete: 'CASCADE' });
Highlight.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Book.hasMany(Highlight, { foreignKey: 'book_id', as: 'highlights', onDelete: 'CASCADE' });
Highlight.belongsTo(Book, { foreignKey: 'book_id', as: 'book' });

// ─── User ↔ Recommendation ────────────────────────────────
User.hasMany(Recommendation, { foreignKey: 'user_id', as: 'recommendations', onDelete: 'CASCADE' });
Recommendation.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Book.hasMany(Recommendation, { foreignKey: 'book_id', as: 'recommendations', onDelete: 'CASCADE' });
Recommendation.belongsTo(Book, { foreignKey: 'book_id', as: 'book' });

// ─── User ↔ RoleRequest ────────────────────────────────────
User.hasMany(RoleRequest, { foreignKey: 'user_id', as: 'roleRequests', onDelete: 'CASCADE' });
RoleRequest.belongsTo(User, { foreignKey: 'user_id', as: 'requester' });

User.hasMany(RoleRequest, { foreignKey: 'actioned_by', as: 'actionedRequests' });
RoleRequest.belongsTo(User, { foreignKey: 'actioned_by', as: 'actionedBy' });

module.exports = {
  sequelize,
  User,
  Book,
  BookPermission,
  UserHistory,
  Highlight,
  Recommendation,
  RoleRequest,
};