import axios from "axios";
import { showError, showSuccess } from './alertActions';
import { hideProgressBar, showProgressBar } from "./progressActions"

export const actionTypes = {
  CATEGORIES_LOADED: 'categoriesLoaded',
  CATEGORY_CREATED: 'categoryCreated',
  CATEGORY_DELETED: 'categoryDeleted',
  CATEGORY_UPDATED: 'categoryUpdated',

  SIZE_ADDED: 'sizeAdded',
  SIZE_UPDATED: 'sizeUpdated',
  SIZE_DELETED: 'sizeDeleted',

  COMBINATION_ADDED: 'combinationAdded',
  COMBINATION_UPDATED: 'combinationUpdated',
  COMBINATION_DELETED: 'combinationDeleted',

  PROPERTY_UPDATED: 'categoryPropertyUpdated',
  PROPERTY_VALUE_ADDED: 'categoryPropertyValueAdded',
  PROPERTY_VALUE_UPDATED: 'categoryPropertyValueUpdated',
  PROPERTY_VALUE_DELETED: 'categoryPropertyValueDeleted',

  LAST_UPDATED_SINGLE_STAMP_CHANGED: 'lastUpdatedSingleStampChanged', //cannot put in system actions, it creates chicken egg problem both files importing form each other
}

export const loadCategories = () => {
  return (dispatch, getState) => {
    const state = getState();
    const storeId = state.stores.selectedStoreId;
    axios.get('/api/categories', { params: { storeId } }).then( ({ data }) => {
      dispatch({ type: actionTypes.CATEGORIES_LOADED, storeId, categories: data });
    }).catch( err => {
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    });
  }
}

export const createCategory = (storeId, category, now, lastAction) => {
  return (dispatch, getState) => {
    const state = getState();
    
    const reduxLastAction = state.system.lastUpdatedStamps[storeId].categories;
    if(reduxLastAction !== lastAction) //there are some updates by other device after last sync
      dispatch( loadCategories() );
    else // no changes by other device after last sync
      dispatch( { type: actionTypes.CATEGORY_CREATED, storeId, category } );
    dispatch( cateogriesStampChanged(storeId, now) );
  }
}

export const deleteCategory = (storeId, categoryId) => {
  return (dispatch, getState) => {
    dispatch(showProgressBar());
    axios.post('/api/categories/delete', { storeId, categoryId }).then( ({ data }) => {
      dispatch(hideProgressBar());

      const state = getState();
      const reduxLastAction = state.system.lastUpdatedStamps[storeId].deleteActivity;
      if(reduxLastAction === data.lastAction) //no delete activity after last sycn
        dispatch({ type: actionTypes.LAST_UPDATED_SINGLE_STAMP_CHANGED, storeId, collectionName: 'deleteActivity', newStamp: data.now });
      dispatch( { type: actionTypes.CATEGORY_DELETED, storeId, categoryId } );
      dispatch( showSuccess('Category deleted') );
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }
}

export const deleteSize = (storeId, categoryId, sizeId) => {
  return (dispatch, getState) => {
    dispatch(showProgressBar());
    axios.post('/api/categories/deleteSize', { storeId, categoryId, sizeId }).then( ({ data }) => {
      dispatch(hideProgressBar());
      dispatch( updateCategory( storeId, categoryId, data.category, data.now, data.lastAction ) );
      dispatch( showSuccess('Size deleted') );
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }
}

export const deleteCombination = (storeId, categoryId, combinationId) => {
  return (dispatch, getState) => {
    dispatch(showProgressBar());
    axios.post('/api/categories/deleteCombination', { storeId, categoryId, combinationId }).then( ({ data }) => {
      dispatch(hideProgressBar());
      dispatch( updateCategory( storeId, categoryId, data.category, data.now, data.lastAction ) );
      dispatch( showSuccess('Color deleted') );
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }
}

export const deletePropertyValue = (storeId, categoryId, propertyId, valueId) => {
  return (dispatch, getState) => {
    dispatch(showProgressBar());
    axios.post('/api/categories/deletePropertyValue', { storeId, categoryId, propertyId, valueId }).then( ({ data }) => {
      dispatch(hideProgressBar());
      dispatch( updateCategory( storeId, categoryId, data.category, data.now, data.lastAction ) );
      dispatch( showSuccess('Value deleted') );
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }
}

export const updateCategory = (storeId, categoryId, category, now, lastAction) => {
  return (dispatch, getState) => {
    const state = getState();
    const reduxLastAction = state.system.lastUpdatedStamps[storeId].categories;
    if(reduxLastAction !== lastAction) //there are some updates by other device after last sync
      dispatch( loadCategories() );
    else // no changes by other device after last sync
      dispatch( { type: actionTypes.CATEGORY_UPDATED, storeId, categoryId, category } );
    dispatch( cateogriesStampChanged(storeId, now) );
  }
}

export const cateogriesStampChanged = (storeId, newStamp) => {
  return { type: actionTypes.LAST_UPDATED_SINGLE_STAMP_CHANGED, storeId, collectionName: 'categories', newStamp }
}