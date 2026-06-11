require('dotenv').config();
const { sequelize } = require('../models');

async function migrate() {
  try {
    console.log('🔄  Connecting to database...');
    await sequelize.authenticate();
    console.log('✅  Connection established.');

    console.log('🔄  Running migrations (ALTER)...');
    // alter:true updates columns without dropping; use force:true only in dev to wipe+recreate
    await sequelize.sync({ alter: true });
    console.log('✅  All tables synced successfully.');

    process.exit(0);
  } catch (err) {
    console.error('❌  Migration failed:', err);
    process.exit(1);
  }
}

migrate();