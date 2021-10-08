import axios from "axios";
//import { showError, showSuccess } from './alertActions';
import { hideProgressBar, showProgressBar } from "./progressActions"

export const actionTypes = {
  ITEMS_LOADED: 'itemsLoaded',
  ITEM_CREATED: 'itemCreated',
  ITEM_UPDATED: 'itemUpdated',
  ITEM_DELETED: 'itemDeleted',

  EMPTY_ITEMS: 'emptyItems',
  FILTERS_CHANGED: 'filtersChanged'
}


export const loadItems = (recordsPerPage) => {
  return (dispatch, getState) => {
    const state = getState();
    const storeId = state.stores.selectedStoreId;
    let filters = {};
    let skip = 0;
    if(state.items[storeId] && state.items[storeId].filters)
      filters = state.items[storeId].filters;
    if(state.items[storeId] && state.items[storeId].filteredItems)
      skip = state.items[storeId].filteredItems.length;
    dispatch(showProgressBar());
    axios.post('/api/items/search', { storeId, ...filters, skip, recordsPerPage} ).then( ({ data }) => {
      dispatch({ type: actionTypes.ITEMS_LOADED, storeId, items: data.items, totalRecords: data.totalRecords });
      dispatch(hideProgressBar());
    }).catch( err => err );
  }
}

export const resetItems = (storeId) => {
  return {
    type: actionTypes.EMPTY_ITEMS,
    storeId
  }
}

export const createItem = (storeId, item) => {
  return {
    type: actionTypes.ITEM_CREATED,
    storeId,
    item
  }
}

export const changeFilters = (storeId, filters) => {
  return {
    type: actionTypes.FILTERS_CHANGED,
    storeId,
    filters
  }
}