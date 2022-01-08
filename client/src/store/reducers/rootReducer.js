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
import adjustmentReasonsReducer from './adjustmentReasonsReducer';
import accountsReducer from './accountsReducer';
import customerReducer from './customerReducer';
import systemReducer from './systemReducer';
import purchaseOrdersReducer from './purchaseOrdersReducer';
import rtvsReducer from './rtvsReducer';
import grnsReducer from './grnsReducer';
import salesReducer from './salesReducer';
import closingsReducer from './closingsReducer';
import dashboardReducer from './dashboardReducer';

function storeageReducer(state = { loaded: false }, action) {
    switch (action.type) {
        case storage.LOAD:
            return { ...state, loaded: true };
 
        case storage.SAVE:
           // console.log('Something has changed and written to disk!');
        break;
        default:
            return state;
    }
}

export const staticReducers = {
  //signin, signup, logout, reset Password, user profile settings
  auth: authReducer,
  system: systemReducer,
  //General
  form: formReducer,
  progressBar: progressReducer,
  alert: alertReducer,
  storage: storeageReducer, //IndexedDB persistant Storage
  //dashboard
  dashboard: dashboardReducer,
  //Stock Module
  items: itemReducer,
  categories: categoryReducer,
  itemProperties: itemPropertiesReducer,
  adjustmentReasons: adjustmentReasonsReducer,
  //Sales Module
  sales: salesReducer,
  closings: closingsReducer,
  //Purchase module
  purchaseOrders: purchaseOrdersReducer,
  grns: grnsReducer,
  rtvs: rtvsReducer,

  //Parties module
  suppliers: supplierReducer,
  customers: customerReducer,
  //Accounts module
  accounts: accountsReducer,
  stores: storeReducer,
  help: helpReducer,
}
const rootReducer = combineReducers(staticReducers);

export default storage.reducer(rootReducer, merger);
