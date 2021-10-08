import { reducer as formReducer } from 'redux-form';
import * as storage from 'redux-storage'
import { combineReducers } from 'redux';
import  authReducer  from './authReducer';
import progressReducer from './progressReducer';
import merger from './merger';
import storeReducer from './storeReducer';
import alertReducer from './alertReducer';
import helpReducer from './helpReducer';
import categoryReducer from './categoryReducer';
import itemPropertiesReducer from './itemPropertiesReducer';
import supplierReducer from './supplierReducer';
import itemReducer from './itemReducer';

function storeageReducer(state = { loaded: false }, action) {
    switch (action.type) {
        case storage.LOAD:
            return { ...state, loaded: true };
 
        case storage.SAVE:
            console.log('Something has changed and written to disk!');
        break;
        default:
            return state;
    }
}

export const staticReducers = {
  auth: authReducer,
  items: itemReducer,
  categories: categoryReducer,
  itemProperties: itemPropertiesReducer,

  suppliers: supplierReducer,
  stores: storeReducer,
  help: helpReducer,
  
  form: formReducer,
  progressBar: progressReducer,
  alert: alertReducer,
  storage: storeageReducer 
}
const rootReducer = combineReducers(staticReducers);

export default storage.reducer(rootReducer, merger);
