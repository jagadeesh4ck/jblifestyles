/**
 * Create an admin user by hashing password and inserting into users table.
 * Usage:
 *   $env:DATABASE_URL="postgres://postgres:postgres@localhost:5432/dropship"
 *   $env:ADMIN_EMAIL="admin@jblifestyles.com"
 *   $env:ADMIN_PASSWORD="StrongPass123"
 *   node src/scripts/createAdmin.js
 *
 * Or:
 *   node src/scripts/createAdmin.js admin@jblifestyles.com StrongPass123
 */
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const argv = process.argv.slice(2);
  const email = argv[0] || process.env.ADMIN_EMAIL;
  const password = argv[1] || process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Usage: set ADMIN_EMAIL and ADMIN_PASSWORD env vars or pass as args');
    process.exit(1);
  }

  try {
    const hash = bcrypt.hashSync(password, 10);
    const q = `
      INSERT INTO users (email, password_hash, role)
      VALUES ($1, $2, 'admin')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'
      RETURNING id, email, role;
    `;
    const { rows } = await pool.query(q, [email, hash]);
    console.log('Admin user created/updated:', rows[0]);
  } catch (err) {
    console.error('Error creating admin user:', err);
  } finally {
    await pool.end();
  }
}

main();