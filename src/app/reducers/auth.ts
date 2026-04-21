import { USER_LOGIN_REQUEST, USER_LOGIN_COMPLETE, USER_LOGIN_ERROR, RESET_USER_LOGIN } from "../action";

const INITIALSTATE = {
  data: null,
  isLoading: false,
  isError: false,
  error: null,
};

export default function reducer(state = INITIALSTATE, action: any) {
  console.log(action.type);
  switch (action.type) {
    case USER_LOGIN_REQUEST:
      return {
        ...state,
        data: null,
        isLoading: true,
        isError: false,
        error: null,
      };

    case USER_LOGIN_COMPLETE:
      return {
        ...state,
        data: action.payload || null,
        isLoading: false,
        isError: false,
        error: null,
      };

    case USER_LOGIN_ERROR:
      return {
        ...state,
        data: null,
        isLoading: false,
        isError: true,
        error: action.error || 'Login failed',
      };

    case RESET_USER_LOGIN:
      return INITIALSTATE;

    default:
      return state;
  }
}
