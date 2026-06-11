const { Book, BookPermission } = require('../models');

/**
 * Fetch a book by ID. Returns null if not found.
 */
async function getBookById(bookId) {
  return Book.findByPk(bookId, {
    include: [{ association: 'author', attributes: ['id', 'name', 'email'] }],
  });
}

/**
 * Check whether a user can READ a given book.
 *
 * Rules:
 *  - Admin can read anything.
 *  - The book's author can read their own book.
 *  - Public + published books are readable by any authenticated user.
 *  - Private books require an explicit BookPermission row.
 *
 * @param {object} user - req.user (Sequelize User instance or plain object)
 * @param {object} book - Sequelize Book instance
 * @returns {Promise<boolean>}
 */
async function canReadBook(user, book) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (book.author_id === user.id) return true;
  if (book.visibility === 'public' && book.is_published) return true;

  // Private book — check explicit permission
  const perm = await BookPermission.findOne({
    where: { book_id: book.id, user_id: user.id },
  });
  return !!perm;
}

/**
 * Check whether a user can MANAGE (edit/delete/publish) a book.
 *
 * Rules:
 *  - Admin can manage anything.
 *  - The author owns their book.
 *  - A user with 'manage' permission can also manage.
 *
 * @param {object} user
 * @param {object} book
 * @returns {Promise<boolean>}
 */
async function canManageBook(user, book) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (book.author_id === user.id) return true;

  const perm = await BookPermission.findOne({
    where: { book_id: book.id, user_id: user.id, permission_type: 'manage' },
  });
  return !!perm;
}

module.exports = { getBookById, canReadBook, canManageBook };