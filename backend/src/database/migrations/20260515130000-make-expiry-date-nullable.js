'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('stock_imports', 'expiry_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('stock_imports', 'expiry_date', {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });
  },
};
