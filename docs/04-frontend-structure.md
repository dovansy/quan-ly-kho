# Frontend - Cau Truc va Chi Tiet

## Cau Truc Thu Muc

```
frontend/src/
├── components/
│   ├── atoms/          # UI co ban: Button, Input, Select, Table, Modal, AutoComplete, ...
│   ├── molecules/      # Ket hop: ActionColumn, StatCard, FormItem, ...
│   ├── organisms/      # Phuc tap: Header, CrudModal, FilterSection, TableSection
│   └── templates/      # Layout: MainLayout, Notification
├── pages/              # Login, Products, Warehouses, Sales, Accounts, Inventory, MyAccount
├── hooks/api/          # React Query hooks theo module (auth, products, warehouses, sales, accounts, inventory)
├── services/           # Axios services (httpClient + 6 module services)
├── router/             # Route config + PrivateRoute / PublicRoute guards
├── store/              # Redux auth slice (token, user)
├── shared/             # Config: Ant Design theme, React Query, Redux store
├── constants/          # Enums, options, format, error codes, route paths
├── types/              # TypeScript interfaces (API response, User, Role)
├── utils/              # Format helpers, validation rules
└── scss/               # Global styles
```

## Routing

| Path | Page | Guard | Mo Ta |
|------|------|-------|-------|
| `/login` | LoginPage | Public | Dang nhap |
| `/` | HomePage | Private | Layout chinh |
| `/inventory` | InventoryPage | Private | Ton kho |
| `/products` | ProductsPage | Private | San pham |
| `/warehouses` | WarehousesPage | Private | Kho hang |
| `/sales` | SalesPage | Private | Ban hang |
| `/accounts` | AccountsPage | Private | Tai khoan |
| `/my-profile` | MyAccountPage | Private | Ca nhan |

## State Management

### Redux (Auth)
- `accessToken`, `refreshToken`, `user` - luu vao localStorage qua redux-persist
- Actions: `loginSuccess`, `logout`, `updateUser`, `setAccessToken`

### React Query (Server State)
- Moi module co query keys rieng (vd: `['products', 'list', filters]`)
- Mutations tu dong invalidate cache khi thanh cong
- `keepPreviousData` cho inventory stats/filters (tranh nhay data)
- `staleTime: 5-10 phut` cho options/list (it thay doi)

## Pattern Su Dung

### API Hook Pattern
```typescript
// Query (GET)
const { data, isLoading } = useGetProducts(filters);

// Mutation (POST/PUT/DELETE)
const createMutation = useCreateProduct();
createMutation.mutate(payload, {
  onSuccess: () => message.success('Thanh cong'),
  onError: () => message.error('That bai'),
});
```

### Cascading Filter Pattern (Inventory)
```
User chon Kho
  -> setSelected({ warehouse: '...' })
  -> useGetInventoryFilters(selected) refetch
  -> Dropdown Loai SP, NCC, Lo cap nhat theo kho da chon
```

### Auto-fill Pattern (Products Modal)
```
User chon ten SP da co
  -> auto-fill Loai san pham
  -> User chon Kho + Lo
  -> useGetBatches(name, warehouse) -> dropdown Lo cap nhat
  -> Submit -> Backend tu kiem tra trung (ten+kho+lo) -> cong don hoac tao moi
```
