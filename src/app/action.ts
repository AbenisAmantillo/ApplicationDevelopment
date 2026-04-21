export const USER_LOGIN = 'USER_LOGIN';
export const USER_LOGIN_REQUEST = 'USER_LOGIN_REQUEST';
export const USER_LOGIN_COMPLETE = 'USER_LOGIN_COMPLETE';
export const USER_LOGIN_ERROR = 'USER_LOGIN_ERROR';
export const RESET_USER_LOGIN = 'RESET_USER_LOGIN';

export const authLogin = (payload: any) => ({
  type: USER_LOGIN,
  payload,
});

export const authLogout = () => ({
  type: RESET_USER_LOGIN,
});
