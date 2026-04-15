import { RootState } from '@/shared/redux/store';

export const selectAccessToken = (state: RootState) => state.auth.accessToken;

export const selectUser = (state: RootState) => state.auth.user;

export const selectIsAuthenticated = (state: RootState) => Boolean(state.auth.accessToken);
