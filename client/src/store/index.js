import { createStore, compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './reducers/rootReducer';
import * as storage from 'redux-storage'
import createEngine from 'redux-storage-engine-indexed-db';
const engine = createEngine('my-store');
const storageMiddleware = storage.createMiddleware(engine);
const store = createStore(rootReducer, 
  window.__REDUX_DEVTOOLS_EXTENSION__  && process.env.NODE_ENV !== 'production' ?
  compose(   applyMiddleware(thunk), applyMiddleware(storageMiddleware), window.__REDUX_DEVTOOLS_EXTENSION__({trace: true, traceLimit: 25}) ) : 
  compose(applyMiddleware(thunk), applyMiddleware(storageMiddleware))
);


const load = storage.createLoader(engine);
load(store)
    .then((newState) => {
     // console.log('Loaded state:', newState)
    })
    .catch(() => console.log('Failed to load previous state'));

export default store;