import { authReducer } from '@/store/auth';
import { combineReducers } from '@reduxjs/toolkit';

export const rootReducer = combineReducers({
  auth: authReducer,
});
