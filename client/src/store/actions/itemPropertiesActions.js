import axios from "axios";
import { showError, showSuccess } from './alertActions';
import { hideProgressBar, showProgressBar } from "./progressActions"

export const actionTypes = {
  ITEM_PROPERTIES_LOADED: 'itemPropertiesLoaded',
  ITEM_PROPERTIES_UPDATED: 'itemPropertiesUpdated',

  ITEM_PROPERTY_NAME_UPDATED: 'itemPropertyNameUpdated',
  ITEM_PROPERTY_VALUE_ADDED: 'itemPropertyValueAdded',
  ITEM_PROPERTY_VALUE_UPDATED: 'itemPropertyValueUpdated',
  ITEM_PROPERTY_VALUE_DELETED: 'itemPropertyValueDeleted',
}

export const loadItemProperties = () => {
  return (dispatch, getState) => {
    const state = getState();
    const storeId = state.stores.selectedStoreId;
    if(!state.itemProperties[storeId])
      dispatch(showProgressBar());
    axios.get('/api/itemProperties', { params: { storeId } }).then( ({ data }) => {
      if(!state.itemProperties[storeId])
        dispatch(hideProgressBar());
      dispatch({ type: actionTypes.ITEM_PROPERTIES_LOADED, storeId, properties: data });
    }).catch( err => err );
  }
}

export const deletePropertyValue = (storeId, propertyId, valueId) => {
  return (dispatch, getState) => {
    dispatch(showProgressBar());
    axios.post('/api/itemProperties/deletePropertyValue', { storeId, propertyId, valueId }).then( ({ data }) => {
      dispatch(hideProgressBar());
      dispatch( updateItemProperties( storeId, data ) );
      dispatch( showSuccess('Value deleted') );
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }
}

export const updateItemProperties = (storeId, properties) => {
  return { type: actionTypes.ITEM_PROPERTIES_UPDATED, storeId, properties }
}