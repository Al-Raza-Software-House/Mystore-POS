import axios from "axios";
import { showSuccess } from "./alertActions";
import { hideProgressBar, showProgressBar } from "./progressActions"

export const actionTypes = {
  STORES_LOADED: 'storesLoaded',
  STORE_CREATED: 'storeCreated',
  STORE_SELECTED: 'storeSelected',
  STORE_DELETED: 'storeDeleted',
  STORE_UPDATED: 'storeUpdated'
}

//Load All stores
export const loadStores = () => {
  return (dispatch, getState) => {
    const state = getState();
    if(state.stores.stores.length === 0)
      dispatch(showProgressBar());
    axios.get('/api/stores').then( ({ data }) => {
      const state = getState();
      if(state.stores.stores.length === 0)
        dispatch(hideProgressBar());
      dispatch({ type: actionTypes.STORES_LOADED, stores: data });
    }).catch( err => err );
  }
}

//Load single store
export const loadStore = (storeId) => {
  return (dispatch, getState) => {
    dispatch(showProgressBar());
    axios.get('/api/stores', {params: { storeId }}).then( ({ data }) => {
      dispatch(hideProgressBar());
      dispatch( updateStore(storeId, data) );
    }).catch( err => err );
  }
}

export const selectStore = (id, userRole) => {
  return { type: actionTypes.STORE_SELECTED, id, userRole }
}
export const deleteStore = (id) => {
  return { type: actionTypes.STORE_DELETED, id }
}

export const createStore = (store) => {
  return { type: actionTypes.STORE_CREATED, store }
}

export const updateStore = (id, store) => {
  return { type: actionTypes.STORE_UPDATED, id, store }
}

export const removeUser = (userId) => {
  return (dispatch, getState) => {
    const state = getState();
    const storeId = state.stores.selectedStoreId;
    dispatch(showProgressBar());
    axios.post('/api/stores/removeUser', { storeId, userId }).then( ({ data }) => {
      dispatch(hideProgressBar());
      dispatch( updateStore(storeId, data) );
      dispatch( showSuccess('User removed from store') );
    }).catch( err => err );
  }
}

export const loadBillingHistory = (storeId) => {
  return (dispatch, getState) => {
    dispatch(showProgressBar());
    axios.get("/api/billing/transactions", { params: { storeId } }).then( ({ data }) => {
      const state = getState();
      const store = state.stores.stores.find(item => item._id === state.stores.selectedStoreId);
      dispatch(hideProgressBar());
      dispatch( updateStore(storeId, { ...store, billingHistory: data  }) );
    }).catch( err => err);
  }
}