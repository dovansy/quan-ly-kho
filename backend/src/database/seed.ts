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
  const { User, Role, Warehouse, SmallUnit, Product, StockImport } = await import('../models');

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

    // ── Warehouses ───────────────────────────────────
    const warehouseSpecs = [
      { name: 'Kho Chẵn', address: '123 Cầu Giấy, Hà Nội', manager: 'Nguyễn Văn A' },
      { name: 'Kho Lẻ', address: '456 Nguyễn Huệ, Quận 1, TP.HCM', manager: 'Trần Thị B' },
      { name: 'Kho Thuốc BHYT', address: '789 Nguyễn Văn Linh, Đà Nẵng', manager: 'Lê Văn C' },
    ];
    const warehouses = await Promise.all(
      warehouseSpecs.map(async (w) => {
        const [row] = await Warehouse.findOrCreate({
          where: { name: w.name },
          defaults: { ...w, status: 'active' },
          transaction: t,
        });
        return row;
      }),
    );
    console.log(`[seed] ${warehouses.length} warehouses created.`);

    // ── Small Units ──────────────────────────────────
    const smallUnitSpecs = [
      { code: 'hop', label: 'Hộp' },
      { code: 'goi', label: 'Gói' },
      { code: 'tui', label: 'Túi' },
      { code: 'lo',  label: 'Lọ' },
      { code: 'vien', label: 'Viên' },
      { code: 'chai', label: 'Chai' },
    ];
    const smallUnits = await Promise.all(
      smallUnitSpecs.map(async (u) => {
        const [row] = await SmallUnit.findOrCreate({
          where: { code: u.code },
          defaults: { ...u, status: 'active' },
          transaction: t,
        });
        return row;
      }),
    );
    console.log(`[seed] ${smallUnits.length} small units created.`);

    const unitByCode = (code: string) => smallUnits.find(u => u.code === code)!;

    // ── Demo Products + Stock Imports ────────────────
    const importSpecs = [
      {
        product: 'Paracetamol 500mg', category: 'Thuốc giảm đau',
        small_unit: 'vien',
        warehouse: warehouses[0], supplier: 'Dược Hậu Giang', batch: 'BATCH001',
        carton_quantity: 10, units_per_carton: 500, piece_quantity: 0,
        expiry_date: '2027-03-15',
      },
      {
        product: 'Amoxicillin 250mg', category: 'Kháng sinh',
        small_unit: 'goi',
        warehouse: warehouses[1], supplier: 'Traphaco', batch: 'BATCH002',
        carton_quantity: 5, units_per_carton: 24, piece_quantity: 0,
        expiry_date: '2026-04-10',
      },
      {
        product: 'Vitamin C 1000mg', category: 'Vitamin',
        small_unit: 'vien',
        warehouse: warehouses[0], supplier: 'Imexpharm', batch: 'BATCH003',
        carton_quantity: 30, units_per_carton: 100, piece_quantity: 0,
        expiry_date: '2026-12-01',
      },
      {
        product: 'Omeprazol 20mg', category: 'Thuốc tiêu hóa',
        small_unit: 'vien',
        warehouse: warehouses[1], supplier: 'Dược Hậu Giang', batch: 'BATCH004',
        carton_quantity: 10, units_per_carton: 80, piece_quantity: 0,
        expiry_date: '2026-06-30',
      },
    ];

    for (const spec of importSpecs) {
      const unit = unitByCode(spec.small_unit);
      const [product] = await Product.findOrCreate({
        where: { name: spec.product },
        defaults: {
          name: spec.product,
          category: spec.category,
          supplier: spec.supplier,
          default_small_unit_id: unit.id,
          status: 'active',
        },
        transaction: t,
      });
      await StockImport.create({
        product_id: product.id,
        warehouse_id: spec.warehouse.id,
        supplier: spec.supplier,
        batch: spec.batch,
        small_unit_id: unit.id,
        carton_quantity: spec.carton_quantity,
        units_per_carton: spec.units_per_carton,
        piece_quantity: spec.piece_quantity,
        expiry_date: new Date(spec.expiry_date),
        imported_by_user_id: superUser.id,
        import_date: new Date(),
        note: null,
      }, { transaction: t });
    }
    console.log(`[seed] ${importSpecs.length} stock_imports created (inventory_balance auto-updated by trigger).`);
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
