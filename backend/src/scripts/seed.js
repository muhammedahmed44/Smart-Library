require('dotenv').config();
const { sequelize, User, Book } = require('../models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('🌱  Seeding database...');

    // Admin
    const [admin] = await User.findOrCreate({
      where: { email: 'admin@elib.dev' },
      defaults: {
        name: 'Admin',
        email: 'admin@elib.dev',
        password_hash: 'Admin@1234',  // hashed by beforeCreate hook
        role: 'admin',
        preferences: { genres: [], readingSpeed: 'medium', theme: 'light' },
      },
    });
    console.log(`✅  Admin user: admin@elib.dev / Admin@1234 (id=${admin.id})`);

    // Demo author
    const [author] = await User.findOrCreate({
      where: { email: 'author@elib.dev' },
      defaults: {
        name: 'Demo Author',
        email: 'author@elib.dev',
        password_hash: 'Author@1234',
        role: 'author',
        preferences: { genres: ['Fiction', 'Science'], readingSpeed: 'fast', theme: 'dark' },
      },
    });
    console.log(`✅  Author user: author@elib.dev / Author@1234 (id=${author.id})`);

    // Demo regular user
    const [user] = await User.findOrCreate({
      where: { email: 'user@elib.dev' },
      defaults: {
        name: 'Demo User',
        email: 'user@elib.dev',
        password_hash: 'User@1234',
        role: 'user',
        preferences: { genres: ['Fiction'], readingSpeed: 'medium', theme: 'light' },
      },
    });
    console.log(`✅  Regular user: user@elib.dev / User@1234 (id=${user.id})`);

    console.log('🎉  Seed complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  }
}

seed();