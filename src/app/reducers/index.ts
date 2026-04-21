import { applyMiddleware, combineReducers, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import auth from '../reducers/auth';

const sagaMiddleware = createSagaMiddleware();

const rootReducer = combineReducers({
  auth,
});

export default () => {
  const store = createStore(rootReducer, applyMiddleware(sagaMiddleware));
  const runSaga = sagaMiddleware.run;

  // IMPORTANT: No redux-persist / AsyncStorage here.
  // Auth flow state must be managed exclusively in the reducer.
  return { store, runSaga };
};
