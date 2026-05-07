import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

dotenv.config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    multipleStatements: true,
  });

  try {
    const sql = fs.readFileSync(path.resolve(__dirname, './migration.sql'), 'utf8');
    // mysql2 multipleStatements không hỗ trợ DELIMITER → tách 2 phần
    const [ddlPart, triggerPart] = sql.split('DELIMITER $$');
    await connection.query(ddlPart);
    if (triggerPart) {
      // Bỏ "DELIMITER ;" cuối, tách trigger theo "$$"
      const triggers = triggerPart
        .replace(/DELIMITER ;\s*$/, '')
        .split('$$')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      for (const t of triggers) {
        await connection.query(t);
      }
    }
    console.log('[migration] Schema + triggers created.');
  } finally {
    await connection.end();
  }
}

async function runSeed() {
  const sequelize = (await import('../models/index')).default;
  const { User, Role } = await import('../models');

  await sequelize.authenticate();

  await sequelize.transaction(async (t) => {
    // ── Roles ────────────────────────────────────────
    const [superAdminRole] = await Role.findOrCreate({
      where: { role: 'super_admin' }, defaults: { role: 'super_admin' }, transaction: t,
    });
    await Role.findOrCreate({
      where: { role: 'admin' }, defaults: { role: 'admin' }, transaction: t,
    });
    console.log('[seed] Roles created.');

    // ── Super Admin ──────────────────────────────────
    const superPwd = await bcrypt.hash('super123', 10);
    const [superUser] = await User.findOrCreate({
      where: { username: 'superadmin' },
      defaults: {
        full_name: 'Super Admin',
        username: 'superadmin',
        email: 'superadmin@quanlykho.com',
        phone: '0900000000',
        password_hash: superPwd,
        status: 'active',
      },
      transaction: t,
    });
    await (superUser as any).setRoles([superAdminRole], { transaction: t });
    console.log('[seed] Super admin created (superadmin / super123).');
  });

  await sequelize.close();
}

(async () => {
  try {
    await runMigration();
    await runSeed();
    console.log('✅ Migration and seed completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
})();
