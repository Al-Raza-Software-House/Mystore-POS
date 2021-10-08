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
}

export const loadCategories = () => {
  return (dispatch, getState) => {
    const state = getState();
    const storeId = state.stores.selectedStoreId;
    if(!state.categories[storeId] || state.categories[storeId].length === 0)
      dispatch(showProgressBar());
    axios.get('/api/categories', { params: { storeId } }).then( ({ data }) => {
      if(!state.categories[storeId] || state.categories[storeId].length === 0)
        dispatch(hideProgressBar());
      dispatch({ type: actionTypes.CATEGORIES_LOADED, storeId, categories: data });
    }).catch( err => err );
  }
}

export const createCategory = (storeId, category) => {
  return { type: actionTypes.CATEGORY_CREATED, storeId, category }
}

export const deleteCategory = (storeId, categoryId) => {
  return (dispatch, getState) => {
    dispatch(showProgressBar());
    axios.post('/api/categories/delete', { storeId, categoryId }).then( ({ data }) => {
      dispatch(hideProgressBar());
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
      dispatch( updateCategory( storeId, categoryId, data ) );
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
      dispatch( updateCategory( storeId, categoryId, data ) );
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
      dispatch( updateCategory( storeId, categoryId, data ) );
      dispatch( showSuccess('Value deleted') );
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }
}

export const updateCategory = (storeId, categoryId, category) => {
  return { type: actionTypes.CATEGORY_UPDATED, storeId, categoryId, category }
}