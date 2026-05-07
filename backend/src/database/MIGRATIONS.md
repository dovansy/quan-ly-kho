# Database Migrations

Workflow dùng `sequelize-cli` để quản lý thay đổi schema **không mất data** trên production.

## Cấu trúc

```
src/database/
  ├── config.js          # config sequelize-cli (đọc từ .env)
  ├── migration.sql      # initial schema (dùng cho `npm run seed` setup DB mới)
  ├── seed.ts            # seed initial data (super admin)
  ├── migrations/        # mỗi file = 1 thay đổi schema
  └── seeders/           # seed data động (ít dùng)
```

## Cách thêm cột mới

### 1. Tạo file migration

```bash
npm run migrate:create -- add-note-to-products
```

Sequelize tạo file `src/database/migrations/<timestamp>-add-note-to-products.js`.

### 2. Sửa nội dung file

```js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('products', 'note', {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('products', 'note');
  },
};
```

### 3. Chạy migration trên DB hiện tại

```bash
npm run migrate
```

Sequelize check bảng `SequelizeMeta` → chỉ chạy file chưa apply. Áp dụng cho cả dev lẫn production.

### 4. Cập nhật song song

- **Model Sequelize** trong `src/models/<Table>.ts`: thêm field tương ứng (`declare`, `init`)
- **Controller**: xử lý read/write cột mới
- **`migration.sql`**: thêm cột vào `CREATE TABLE` để DB mới setup vẫn đầy đủ

### 5. Rollback nếu sai

```bash
npm run migrate:undo
```

Gọi hàm `down` của migration cuối cùng.

## Lệnh hữu dụng

| Lệnh | Tác dụng |
|------|---------|
| `npm run migrate` | Chạy mọi migration chưa apply |
| `npm run migrate:undo` | Undo migration cuối cùng |
| `npm run migrate:status` | Xem migration nào đã chạy / chưa |
| `npm run migrate:create -- <name>` | Tạo file migration mới |

## API thường dùng

```js
// Cột
await queryInterface.addColumn('table', 'col', { type: Sequelize.STRING });
await queryInterface.removeColumn('table', 'col');
await queryInterface.renameColumn('table', 'old', 'new');
await queryInterface.changeColumn('table', 'col', { type: Sequelize.TEXT });

// Bảng
await queryInterface.createTable('table', { ... });
await queryInterface.dropTable('table');

// Index
await queryInterface.addIndex('table', ['col']);
await queryInterface.removeIndex('table', 'idx_name');

// Foreign key
await queryInterface.addColumn('orders', 'user_id', {
  type: Sequelize.INTEGER,
  references: { model: 'users', key: 'id' },
  onDelete: 'CASCADE',
});

// Raw SQL khi cần
await queryInterface.sequelize.query('ALTER TABLE ...');
```

## Lưu ý quan trọng

- **Backup trước khi chạy trên production**:
  ```bash
  mysqldump -h <host> -u <user> -p <db> > backup_$(date +%Y%m%d).sql
  ```
- **Không sửa file migration đã commit** — tạo file mới thay vì edit
- **Không chạy `npm run seed` trên production** — sẽ DROP hết data
- Trên DB cũ chưa từng dùng sequelize-cli, lần đầu chạy `migrate` sẽ tạo bảng `SequelizeMeta` rỗng và không apply gì cả (vì chưa có file migration). Từ migration tạo ra sau đó sẽ được track.
