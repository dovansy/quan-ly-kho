import storage from 'redux-persist/es/storage';

export const persistConfig = {
  key: 'root',
  storage,
  version: 1,
  whitelist: ['auth'],
};
