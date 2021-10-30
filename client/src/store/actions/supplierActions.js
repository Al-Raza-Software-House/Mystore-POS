import axios from "axios";
import { showSuccess } from './alertActions';
import { hideProgressBar, showProgressBar } from "./progressActions"

export const actionTypes = {
  SUPPLIERS_LOADED: 'suppliersLoaded',
  SUPPLIER_CREATED: 'supplierCreated',
  SUPPLIER_DELETED: 'supplierDeleted',
  SUPPLIER_UPDATED: 'supplierUpdated',
  EMPTY_SUPPLIERS: 'emptySuppliers',
  SYNC_SUPPLIERS: 'syncSuppliers',

  LAST_UPDATED_SINGLE_STAMP_CHANGED: 'lastUpdatedSingleStampChanged', //cannot put in system actions, it creates chicken egg problem both files importing form each other
}

export const syncSuppliers = (lastUpatedStamp) => {
  return async (dispatch, getState) => {
    const state = getState();
    const storeId = state.stores.selectedStoreId;
    let loadedRecords = 0;
    try
    {
      let result = null;
      do
      {        
        result = await axios.get('/api/suppliers', { params: { storeId, skip: loadedRecords, after: lastUpatedStamp } });
        loadedRecords += result.data.suppliers.length;
        dispatch({ type: actionTypes.SYNC_SUPPLIERS, storeId, suppliers: result.data.suppliers });
      }while(result.data.hasMoreRecords)

    }catch(err)
    {

    }
  }
}

export const createSupplier = (storeId, supplier, now, lastAction) => {
  return (dispatch, getState) => {
    const state = getState();
    
    const reduxLastAction = state.system.lastUpdatedStamps[storeId].suppliers;
    if(reduxLastAction !== lastAction) //there are some updates by other device after last sync
      dispatch( syncSuppliers(reduxLastAction) );
    else // no changes by other device after last sync
      dispatch( { type: actionTypes.SUPPLIER_CREATED, storeId, supplier } );
    dispatch( suppliersStampChanged(storeId, now) );
  }
}

export const deleteSupplier = (storeId, supplierId) => {
  return (dispatch, getState) => {
    dispatch(showProgressBar());
    axios.post('/api/suppliers/delete', { storeId, supplierId }).then( ({ data }) => {
      dispatch(hideProgressBar());

      const state = getState();
      const reduxLastAction = state.system.lastUpdatedStamps[storeId].deleteActivity;
      if(reduxLastAction === data.lastAction) //no delete activity after last sycn
        dispatch({ type: actionTypes.LAST_UPDATED_SINGLE_STAMP_CHANGED, storeId, collectionName: 'deleteActivity', newStamp: data.now });
        
      dispatch( { type: actionTypes.SUPPLIER_DELETED, storeId, supplierId } );
      dispatch( showSuccess('Supplier deleted') );
    }).catch( err => err );
  }
}



export const updateSupplier = (storeId, supplierId, supplier, now, lastAction) => {
  return (dispatch, getState) => {
    const state = getState();
    
    const reduxLastAction = state.system.lastUpdatedStamps[storeId].suppliers;
    if(reduxLastAction !== lastAction) //there are some updates by other device after last sync
      dispatch( syncSuppliers(reduxLastAction) );
    else // no changes by other device after last sync
      dispatch( { type: actionTypes.SUPPLIER_UPDATED, storeId, supplierId, supplier } );
    dispatch( suppliersStampChanged(storeId, now) );
  }
}

export const suppliersStampChanged = (storeId, newStamp) => {
  return { type: actionTypes.LAST_UPDATED_SINGLE_STAMP_CHANGED, storeId, collectionName: 'suppliers', newStamp }
}