import dayjs from 'dayjs';
import { jwtDecode } from 'jwt-decode';

export const isEmpty = (value: any) => {
  return value === null || value === undefined || value === '';
};

export const isTokenExpired = (token: string) => {
  const jwtToken = jwtDecode(token);
  const currentTime = dayjs().unix();

  return jwtToken.exp && jwtToken.exp <= currentTime;
};
