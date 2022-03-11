import axios from "axios";
import { showError, showSuccess } from './alertActions';
import { itemsStampChanged, syncItems } from "./itemActions";
import { hideProgressBar, showProgressBar } from "./progressActions"
import { updateSupplier } from "./supplierActions";

export const actionTypes = {
  RTVS_LOADED: 'rtvsLoaded',
  RTV_ADDED: 'rtvAdded',
  RTV_UPDATED: 'rtvUpdated',
  RTV_DELETED: 'rtvDeleted',
  EMPTY_RTVS: 'emptyRtvs',
  FILTERS_CHANGED: 'rtvsFiltersChanged',
  UPDATE_RTV_DRAFT: 'updateRTVDraft'
}

export const addNewRtv = (storeId, rtv) => {
  return { type: actionTypes.RTV_ADDED, storeId, rtv }
}

export const loadRtvs = (recordsPerPage) => {
  return (dispatch, getState) => {
    const state = getState();
    const storeId = state.stores.selectedStoreId;
    let filters = {};
    let skip = 0;
    if(state.rtvs[storeId] && state.rtvs[storeId].filters)
      filters = state.rtvs[storeId].filters;
    if(state.rtvs[storeId] && state.rtvs[storeId].records)
      skip = state.rtvs[storeId].records.length;
    dispatch(showProgressBar());
    axios.post('/api/rtvs', { storeId, ...filters, skip, recordsPerPage} ).then( ({ data }) => {
      dispatch({ type: actionTypes.RTVS_LOADED, storeId, rtvs: data.rtvs, totalRecords: data.totalRecords });
      dispatch(hideProgressBar());
    }).catch( err => {
      dispatch({ type: actionTypes.RTVS_LOADED, storeId, rtvs: [], totalRecords: 0 });
      dispatch(hideProgressBar());
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }
}

export const updateRtv = (storeId, rtvId, rtv) => {
  return { type: actionTypes.RTV_UPDATED, storeId, rtvId, rtv };
}

export const deleteRtv = (storeId, rtvId) => {
  return (dispatch, getState) => {
    const state = getState();
    const itemsLastUpdatedOn = state.system.lastUpdatedStamps[storeId] ? state.system.lastUpdatedStamps[storeId].items : null;
    dispatch(showProgressBar());
    axios.post('/api/rtvs/delete', { storeId, rtvId }).then( ({ data }) => {
      dispatch(hideProgressBar());
      dispatch( { type: actionTypes.RTV_DELETED, storeId, rtvId } );
      if(data.now)
      {
        dispatch( syncItems(itemsLastUpdatedOn) );
        dispatch( itemsStampChanged(storeId, data.now) );
      }
      if(data.supplier)
        dispatch( updateSupplier(storeId, data.supplier._id, data.supplier, data.now, data.lastAction) );
      dispatch( showSuccess('RTV deleted') );
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }
}

export const changeFilters = (storeId, filters) => {
  return { type: actionTypes.FILTERS_CHANGED, storeId, filters }
}

export const emptyRtvs = (storeId) => {
  return { type: actionTypes.EMPTY_RTVS, storeId }
}

export const updateRtvDraft = (storeId, draft) => {
  return { type: actionTypes.UPDATE_RTV_DRAFT, storeId, draft }
}