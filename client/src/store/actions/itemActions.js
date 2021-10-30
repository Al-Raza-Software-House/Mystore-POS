import axios from "axios";
import { showError, showSuccess } from './alertActions';
import { hideProgressBar, showProgressBar } from "./progressActions"

export const actionTypes = {
  ITEMS_LOADED: 'itemsLoaded', //search/filter items
  ITEM_CREATED: 'itemCreated',
  ITEM_UPDATED: 'itemUpdated',
  ITEM_DELETED: 'itemDeleted',

  EMPTY_ITEMS: 'emptyItems',
  FILTERS_CHANGED: 'filtersChanged',

  MASTER_ITEMS_LOADED: 'masterItemsLoaded',
  EMPTY_MASTER_ITEMS: 'emptyMasterItems',
  SYNC_ITEMS: 'syncItems'
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

//sync items in background
export const syncItems = (lastUpatedStamp) => {
  return async (dispatch, getState) => {
    const state = getState();
    const storeId = state.stores.selectedStoreId;
    let loadedItems = 0;
    try
    {
      let result = null;
      do
      {        
        result = await axios.get('/api/items/allItems', { params: { storeId, skip: loadedItems, after: lastUpatedStamp } });
        loadedItems += result.data.items.length;
        dispatch({ type: actionTypes.SYNC_ITEMS, storeId, items: result.data.items });
      }while(result.data.hasMoreRecords)

    }catch(err)
    {

    }
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

export const updateItem = (storeId, itemId, item) => {
  return {
    type: actionTypes.ITEM_UPDATED,
    storeId,
    itemId,
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

export const deleteItem = (storeId, itemId) => {
  return (dispatch, getState) => {
    dispatch(showProgressBar());
    axios.post('/api/items/delete', { storeId, itemId }).then( ({ data }) => {
      dispatch(hideProgressBar());
      dispatch( { type: actionTypes.ITEM_DELETED, storeId, itemId } );
      dispatch( showSuccess('Item deleted') );
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }
}