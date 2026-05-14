'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add payment_status enum to sale_orders, backfill from `paid`
    await queryInterface.addColumn('sale_orders', 'payment_status', {
      type: Sequelize.ENUM('paid', 'unpaid', 'pending'),
      allowNull: false,
      defaultValue: 'unpaid',
    });
    await queryInterface.sequelize.query(
      `UPDATE sale_orders SET payment_status = IF(paid = 1, 'paid', 'unpaid')`
    );

    // 2. Add is_pending flag to stock_exports (existing rows are confirmed = 0)
    await queryInterface.addColumn('stock_exports', 'is_pending', {
      type: Sequelize.TINYINT(1),
      allowNull: false,
      defaultValue: 0,
    });

    // 3. Replace INSERT/DELETE triggers to respect is_pending flag.
    //    UPDATE trigger unchanged: controller uses destroy+recreate pattern,
    //    so UPDATE only fires on same-flag edits (handled correctly by current delta logic).
    await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS trg_se_after_insert`);
    await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS trg_se_after_delete`);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER trg_se_after_insert
      AFTER INSERT ON stock_exports FOR EACH ROW
      BEGIN
        IF NEW.is_pending = 0 THEN
          UPDATE inventory_balance
          SET stock_pieces = stock_pieces - NEW.quantity, updated_at = NOW()
          WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id
            AND supplier = NEW.supplier AND batch = NEW.batch;
        END IF;
      END
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER trg_se_after_delete
      AFTER DELETE ON stock_exports FOR EACH ROW
      BEGIN
        IF OLD.is_pending = 0 THEN
          UPDATE inventory_balance
          SET stock_pieces = stock_pieces + OLD.quantity, updated_at = NOW()
          WHERE product_id = OLD.product_id AND warehouse_id = OLD.warehouse_id
            AND supplier = OLD.supplier AND batch = OLD.batch;
        END IF;
      END
    `);
  },

  async down(queryInterface) {
    // Restore original triggers
    await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS trg_se_after_insert`);
    await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS trg_se_after_delete`);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER trg_se_after_insert
      AFTER INSERT ON stock_exports FOR EACH ROW
      BEGIN
        UPDATE inventory_balance
        SET stock_pieces = stock_pieces - NEW.quantity, updated_at = NOW()
        WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id
          AND supplier = NEW.supplier AND batch = NEW.batch;
      END
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER trg_se_after_delete
      AFTER DELETE ON stock_exports FOR EACH ROW
      BEGIN
        UPDATE inventory_balance
        SET stock_pieces = stock_pieces + OLD.quantity, updated_at = NOW()
        WHERE product_id = OLD.product_id AND warehouse_id = OLD.warehouse_id
          AND supplier = OLD.supplier AND batch = OLD.batch;
      END
    `);

    await queryInterface.removeColumn('stock_exports', 'is_pending');
    await queryInterface.removeColumn('sale_orders', 'payment_status');
  },
};
