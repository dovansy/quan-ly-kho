require('dotenv').config();

const common = {
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'quan_ly_kho',
  define: {
    underscored: true,
    timestamps: true,
  },
};

module.exports = {
  development: { ...common },
  test: { ...common, database: `${common.database}_test` },
  production: { ...common, logging: false },
};
