import { takeLatest, call, put } from 'redux-saga/effects';
import { USER_LOGIN, USER_LOGIN_REQUEST, USER_LOGIN_COMPLETE, USER_LOGIN_ERROR } from '../action';
import { userLogin as userLoginApi } from '../api/auth';

export function* userLoginAsync(action: any): any {
  console.log('User login saga started: ', action);

  try {
    yield put({ type: USER_LOGIN_REQUEST });

    const data = yield call(userLoginApi, action.payload);

    yield put({
      type: USER_LOGIN_COMPLETE,
      payload: data,
    });
  } catch (error) {
    console.log('User login saga error: ', error);
    yield put({
      type: USER_LOGIN_ERROR,
      error: (error as any)?.message || 'Login failed',
    });
  }
}

export function* userLogin() {
  yield takeLatest(USER_LOGIN, userLoginAsync);
}
