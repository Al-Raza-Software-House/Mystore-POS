import axios from "axios";
import { showError } from './alertActions';
import { hideProgressBar, showProgressBar } from "./progressActions"

export const actionTypes = {
  CLOSINGS_LOADED: 'closingsLoaded',
  CLOSING_ADDED: 'closingAdded',
  CLOSING_UPDATED: 'closingUpdated',
  CLOSING_DELETED: 'closingDeleted',
  EMPTY_CLOSINGS: 'emptyClosings',
  FILTERS_CHANGED: 'closingFiltersChanged'
}

export const addNewClosing = (storeId, closing) => {
  return { type: actionTypes.CLOSING_ADDED, storeId, closing }
}

export const loadClosings = (recordsPerPage) => {
  return (dispatch, getState) => {
    const state = getState();
    const storeId = state.stores.selectedStoreId;
    let filters = {};
    let skip = 0;
    if(state.closings[storeId] && state.closings[storeId].filters)
      filters = state.closings[storeId].filters;
    if(state.closings[storeId] && state.closings[storeId].records)
      skip = state.closings[storeId].records.length;
    dispatch(showProgressBar());
    axios.post('/api/closings', { storeId, ...filters, skip, recordsPerPage} ).then( ({ data }) => {
      dispatch({ type: actionTypes.CLOSINGS_LOADED, storeId, closings: data.closings, totalRecords: data.totalRecords });
      dispatch(hideProgressBar());
    }).catch( err => {
      dispatch({ type: actionTypes.CLOSINGS_LOADED, storeId, closings: [], totalRecords: 0 });
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    });
  }
}

export const updateClosing = (storeId, closingId, closing) => {
  return { type: actionTypes.CLOSING_UPDATED, storeId, closingId, closing };
}

export const deleteClosing = (storeId, closingId) => {
  return { type: actionTypes.CLOSING_DELETED, storeId, closingId }
}

export const changeFilters = (storeId, filters) => {
  return { type: actionTypes.FILTERS_CHANGED, storeId, filters }
}

export const emptyClosings = (storeId) => {
  return { type: actionTypes.EMPTY_CLOSINGS, storeId }
}