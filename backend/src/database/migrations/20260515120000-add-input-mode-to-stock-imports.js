'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('stock_imports', 'input_total_pieces', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Nếu có giá trị: bản ghi được nhập theo mode "viên" (tổng viên user nhập)',
    });
    await queryInterface.addColumn('stock_imports', 'units_per_box', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('stock_imports', 'boxes_per_carton', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('stock_imports', 'boxes_per_carton');
    await queryInterface.removeColumn('stock_imports', 'units_per_box');
    await queryInterface.removeColumn('stock_imports', 'input_total_pieces');
  },
};
