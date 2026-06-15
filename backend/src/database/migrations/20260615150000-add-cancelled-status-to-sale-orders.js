'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('sale_orders', 'payment_status', {
      type: Sequelize.ENUM('paid', 'unpaid', 'pending', 'cancelled'),
      allowNull: false,
      defaultValue: 'unpaid',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "UPDATE sale_orders SET payment_status = 'pending' WHERE payment_status = 'cancelled'"
    );

    await queryInterface.changeColumn('sale_orders', 'payment_status', {
      type: Sequelize.ENUM('paid', 'unpaid', 'pending'),
      allowNull: false,
      defaultValue: 'unpaid',
    });
  },
};
