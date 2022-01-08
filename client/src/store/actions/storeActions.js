import axios from "axios";
import { showError, showSuccess } from "./alertActions";
import { hideProgressBar, showProgressBar } from "./progressActions"

export const actionTypes = {
  STORES_LOADED: 'storesLoaded',
  STORE_CREATED: 'storeCreated',
  STORE_SELECTED: 'storeSelected',
  STORE_DELETED: 'storeDeleted',
  STORE_UPDATED: 'storeUpdated',
  STORE_USER_ROLE_CHANGED: 'storeUserRoleChanged', //logged in user role changed for selected store
  LAST_END_OF_DAY_UPDATED: 'lastEndOfDayUpdated',
  LAST_UPDATED_SINGLE_STAMP_CHANGED: 'lastUpdatedSingleStampChanged', //cannot put in system actions, it creates chicken egg problem both files importing form each other
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
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    });
  }
}

//Load single store
export const loadSelectedStore = () => {
  return (dispatch, getState) => {
    const state = getState();
    const storeId = state.stores.selectedStoreId;
    const userRole = state.stores.userRole;
    const uid = state.auth.uid;
    axios.get('/api/stores', {params: { storeId }}).then( ({ data }) => {
      dispatch( updateStore(storeId, data) );
      for(let i=0; i<data.users.length; i++)
      {
        if(data.users[i].userId === uid && data.users[i].userRole !== userRole) //user role changed
          dispatch(changeUserRole(data.users[i].userRole))
      }
    }).catch( err => {
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    });
  }
}

export const changeUserRole = newRole => {
  return { type: actionTypes.STORE_USER_ROLE_CHANGED, newRole };
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
      dispatch( updateStore(storeId, data.store) );
      dispatch( storesStampChanged(storeId, data.now) );
      dispatch( showSuccess('User removed from store') );
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    });
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
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    });
  }
}

export const storesStampChanged = (storeId, newStamp) => {
  return { type: actionTypes.LAST_UPDATED_SINGLE_STAMP_CHANGED, storeId, collectionName: 'stores', newStamp }
}

export const lastEndOfDayUpdated = (storeId, newEndOfDay) => {
  return { type: actionTypes.LAST_END_OF_DAY_UPDATED, storeId, newEndOfDay }
}

