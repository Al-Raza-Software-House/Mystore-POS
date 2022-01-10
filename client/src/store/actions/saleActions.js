import axios from "axios";
import { showError, showSuccess } from './alertActions';
import { hideProgressBar, showProgressBar } from "./progressActions"
import { updateCustomer } from "./customerActions";
import { actionTypes as accountActions, addNewTxns } from "./accountActions";
import { itemsStampChanged, syncItems } from "./itemActions";
import { loadSelectedStore } from "./storeActions";

export const actionTypes = {
  SALES_LOADED: 'salesLoaded',
  SALE_ADDED: 'saleAdded',
  SALE_UPDATED: 'saleUpdated',
  SALE_VOIDED: 'saleDeleted',
  EMPTY_SALES: 'emptySales',
  FILTERS_CHANGED: 'saleFiltersChanged',
  
  OFFLINE_SALE_ADDED: 'offlineSaleAdded',
  OFFLINE_SALE_REMOVED: 'offlineSaleRemoved'
}

export const addOfflineSale = (storeId, sale) => {
  return (dispatch, getState) => {
    dispatch( { type: actionTypes.OFFLINE_SALE_ADDED, storeId, sale: { _id: Math.random().toString(36).substring(2), ...sale } } );
    if(getState().system.online)
      setTimeout(() => {
        dispatch( syncSale(storeId) );
      }, 3000);
  };
}

export const removeOfflineSale = (storeId, saleId) => {
  return { type: actionTypes.OFFLINE_SALE_REMOVED, storeId, saleId };
}

export const addNewSale = (storeId, sale) => {
  return { type: actionTypes.SALE_ADDED, storeId, sale };
}

export const loadSales = (recordsPerPage) => {
  return (dispatch, getState) => {
    const state = getState();
    const storeId = state.stores.selectedStoreId;
    let filters = {};
    let skip = 0;
    if(state.sales[storeId] && state.sales[storeId].filters)
      filters = state.sales[storeId].filters;
    if(state.sales[storeId] && state.sales[storeId].records)
      skip = state.sales[storeId].records.length;
    dispatch(showProgressBar());
    axios.post('/api/sales', { storeId, ...filters, skip, recordsPerPage} ).then( ({ data }) => {
      dispatch({ type: actionTypes.SALES_LOADED, storeId, sales: data.sales, totalRecords: data.totalRecords });
      dispatch(hideProgressBar());
    }).catch( err => {
      dispatch({ type: actionTypes.SALES_LOADED, storeId, sales: [], totalRecords: 0 });
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    });
  }
}

export const updateSale = (storeId, saleId, sale) => {
  return { type: actionTypes.SALE_UPDATED, storeId, saleId, sale }
}

export const voidSale = (storeId, saleId) => {
  return (dispatch, getState) => {
    const state = getState();
    const itemsLastUpdatedOn = state.system.lastUpdatedStamps[storeId] ? state.system.lastUpdatedStamps[storeId].items : null;
    dispatch(showProgressBar());
    axios.post('/api/sales/delete', { storeId, saleId }).then( ({ data }) => {
      dispatch(hideProgressBar());
      dispatch( { type: actionTypes.SALE_VOIDED, storeId, saleId } );
      if(data.now)
      {
        dispatch( syncItems(itemsLastUpdatedOn) );
        dispatch( itemsStampChanged(storeId, data.now) );
      }
      if(data.customer)
        dispatch( updateCustomer(storeId, data.customer._id, data.customer, data.now, data.lastAction) );
      if(data.accountTxnId)
        dispatch( { type: accountActions.TRANSACTION_DELETED, storeId, txnId: data.accountTxnId } );
      dispatch( showSuccess('Sale voided') );
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }
}

export const changeFilters = (storeId, filters) => {
  return { type: actionTypes.FILTERS_CHANGED, storeId, filters }
}

export const emptySales = (storeId) => {
  return { type: actionTypes.EMPTY_SALES, storeId }
}

export const syncSale = (storeId) => {
  return (dispatch, getState) => {
    const state = getState();
    let pendingSales = state.sales[storeId] ? state.sales[storeId].offlineRecords : [];
    if(pendingSales.length === 0)
    {
      dispatch( loadSelectedStore() ); //refresh store to load new sale ID,
      return;
    }
    let sale = pendingSales[ pendingSales.length - 1 ];
    axios.post('/api/sales/create', { storeId, ...sale } ).then( ({ data }) => {
      if(data.sale)
      {
        dispatch( addNewSale(storeId, data.sale) );
        dispatch( removeOfflineSale(storeId, sale._id) );
      }
      if(data.customer)
        dispatch( updateCustomer(storeId, data.customer._id, data.customer, data.now, data.lastAction) );
      if(data.accountTxns.length)
        dispatch( addNewTxns(storeId, data.accountTxns) );
      dispatch( syncSale(storeId) );
    }).catch( err => {
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    });
  }
}