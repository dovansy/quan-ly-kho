'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('stock_imports', 'boxes_per_carton');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('stock_imports', 'boxes_per_carton', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },
};
