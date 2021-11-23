import axios from "axios";
import { showError, showSuccess } from './alertActions';
import { hideProgressBar, showProgressBar } from "./progressActions"

export const actionTypes = {
  ITEMS_LOADED: 'itemsLoaded', //search/filter items
  ITEM_CREATED: 'itemCreated',
  ITEM_UPDATED: 'itemUpdated',
  ITEM_DELETED: 'itemDeleted',

  EMPTY_ITEMS: 'emptyItems',
  FILTERS_CHANGED: 'itemFiltersChanged',

  MASTER_ITEMS_LOADED: 'masterItemsLoaded',
  EMPTY_MASTER_ITEMS: 'emptyMasterItems',
  SYNC_ITEMS: 'syncItems',
  ITEM_SIZE_NAME_UPDATED: 'itemSizeNameUpdated', // item size or code updated in category, update in items too
  ITEM_COMBINATION_NAME_UPDATED: 'itemCombinationNameUpdated', // item combination name updated in category, update in items too
  LAST_UPDATED_SINGLE_STAMP_CHANGED: 'lastUpdatedSingleStampChanged', //cannot put in system actions, it creates chicken egg problem both files importing form each other
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

export const createItem = (storeId, item, now, lastAction) => {
  return (dispatch, getState) => {
    const state = getState();
    const reduxLastAction = state.system.lastUpdatedStamps[storeId].items;
    if(reduxLastAction !== lastAction) //there are some updates by other device after last sync
      dispatch( syncItems(reduxLastAction) );
    else // no changes by other device after last sync
      dispatch( { type: actionTypes.ITEM_CREATED, storeId, item } );
    dispatch( itemsStampChanged(storeId, now) );
  }
}

export const updateItem = (storeId, itemId, item, now, lastAction, deletedSubItems) => {
  return (dispatch, getState) => {
    const state = getState();
    const reduxLastAction = state.system.lastUpdatedStamps[storeId].items;
    if(reduxLastAction !== lastAction) //there are some updates by other device after last sync
      dispatch( syncItems(reduxLastAction) );
    else // no changes by other device after last sync
      dispatch( { type: actionTypes.ITEM_UPDATED, storeId, itemId, item, deletedSubItems } );
    dispatch( itemsStampChanged(storeId, now) );
  }
}

export const adjustStock = (storeId, items, now, lastAction) => {
  return (dispatch, getState) => {
    const state = getState();
    const reduxLastAction = state.system.lastUpdatedStamps[storeId].items;
    if(reduxLastAction !== lastAction) //there are some updates by other device after last sync
      dispatch( syncItems(reduxLastAction) );
    else // no changes by other device after last sync
    {
      for(let i=0; i<items.length; i++)
      {
        dispatch( { type: actionTypes.ITEM_UPDATED, storeId, itemId: items[i].itemId, item: items[i], deletedSubItems: [] } );
      }
    }
    dispatch( itemsStampChanged(storeId, now) );
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
      const state = getState();
      const reduxLastAction = state.system.lastUpdatedStamps[storeId].deleteActivity;
      if(reduxLastAction === data.lastAction) //no delete activity after last sycn
        dispatch({ type: actionTypes.LAST_UPDATED_SINGLE_STAMP_CHANGED, storeId, collectionName: 'deleteActivity', newStamp: data.now });

      dispatch( { type: actionTypes.ITEM_DELETED, storeId, itemId } );
      dispatch( showSuccess('Item deleted') );
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }
}

export const updateItemSize = (storeId, sizeId, sizeCode, sizeName) => {
  return { type: actionTypes.ITEM_SIZE_NAME_UPDATED, storeId, sizeId, sizeCode, sizeName }
}

export const updateItemCombination = (storeId, combinationId, combinationCode, combinationName) => {
  return { type: actionTypes.ITEM_COMBINATION_NAME_UPDATED, storeId, combinationId, combinationCode, combinationName }
}

export const itemsStampChanged = (storeId, newStamp) => {
  return { type: actionTypes.LAST_UPDATED_SINGLE_STAMP_CHANGED, storeId, collectionName: 'items', newStamp }
}