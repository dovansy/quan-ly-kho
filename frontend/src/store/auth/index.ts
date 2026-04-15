import { User } from '@/types/auth.type';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  currentAccount: string | null;
  user: User | null;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  currentAccount: null,
  user: null,
};

export interface LoginPayload {
  accessToken: string;
  refreshToken?: string;
  user: User;
  currentAccount?: string;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<LoginPayload>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken ?? null;
      state.currentAccount = action.payload.currentAccount ?? null;
      state.user = action.payload.user;
    },

    logout() {
      return initialState;
    },

    updateUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },

    setAccessToken(state, action: PayloadAction<string | null>) {
      state.accessToken = action.payload;
    },
  },
});

export const { loginSuccess, logout, updateUser, setAccessToken } = authSlice.actions;

export const authReducer = authSlice.reducer;
