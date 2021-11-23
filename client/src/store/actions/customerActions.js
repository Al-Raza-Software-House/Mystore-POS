import axios from "axios";
import { showError, showSuccess } from './alertActions';
import { hideProgressBar, showProgressBar } from "./progressActions"

export const actionTypes = {
  CUSTOMERS_LOADED: 'customersLoaded',
  CUSTOMER_CREATED: 'customerCreated',
  CUSTOMER_DELETED: 'customerDeleted',
  CUSTOMER_UPDATED: 'customerUpdated',
  EMPTY_CUSTOMERS: 'emptyCustomers',
  SYNC_CUSTOMERS: 'syncCustomers',

  LAST_UPDATED_SINGLE_STAMP_CHANGED: 'lastUpdatedSingleStampChanged', //cannot put in system actions, it creates chicken egg problem both files importing form each other
}


export const syncCustomers = (lastUpatedStamp) => {
  return async (dispatch, getState) => {
    const state = getState();
    const storeId = state.stores.selectedStoreId;
    let loadedRecords = 0;
    try
    {
      let result = null;
      do
      {        
        result = await axios.get('/api/customers', { params: { storeId, skip: loadedRecords, after: lastUpatedStamp } });
        loadedRecords += result.data.customers.length;
        dispatch({ type: actionTypes.SYNC_CUSTOMERS, storeId, customers: result.data.customers });
      }while(result.data.hasMoreRecords)

    }catch(err)
    {

    }
  }
}

export const createCustomer = (storeId, customer, now, lastAction) => {
  return (dispatch, getState) => {
    const state = getState();
    
    const reduxLastAction = state.system.lastUpdatedStamps[storeId].customers;
    if(reduxLastAction !== lastAction) //there are some updates by other device after last sync
      dispatch( syncCustomers(reduxLastAction) );
    else // no changes by other device after last sync
      dispatch( { type: actionTypes.CUSTOMER_CREATED, storeId, customer } );
    dispatch( customersStampChanged(storeId, now) );
  }
}

export const deleteCustomer = (storeId, customerId) => {
  return (dispatch, getState) => {
    dispatch(showProgressBar());
    axios.post('/api/customers/delete', { storeId, customerId }).then( ({ data }) => {
      dispatch(hideProgressBar());

      const state = getState();
      const reduxLastAction = state.system.lastUpdatedStamps[storeId].deleteActivity;
      if(reduxLastAction === data.lastAction) //no delete activity after last sycn
        dispatch({ type: actionTypes.LAST_UPDATED_SINGLE_STAMP_CHANGED, storeId, collectionName: 'deleteActivity', newStamp: data.now });

      dispatch( { type: actionTypes.CUSTOMER_DELETED, storeId, customerId } );
      dispatch( showSuccess('Customer deleted') );
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch( showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }
}



export const updateCustomer = (storeId, customerId, customer, now, lastAction) => {
  return (dispatch, getState) => {
    const state = getState();
    
    const reduxLastAction = state.system.lastUpdatedStamps[storeId].customers;
    if(reduxLastAction !== lastAction) //there are some updates by other device after last sync
      dispatch( syncCustomers(reduxLastAction) );
    else // no changes by other device after last sync
      dispatch( { type: actionTypes.CUSTOMER_UPDATED, storeId, customerId, customer } );
    dispatch( customersStampChanged(storeId, now) );
  }
}

export const customersStampChanged = (storeId, newStamp) => {
  return { type: actionTypes.LAST_UPDATED_SINGLE_STAMP_CHANGED, storeId, collectionName: 'customers', newStamp }
}