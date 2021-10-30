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

  LAST_UPDATED_SINGLE_STAMP_CHANGED: 'lastUpdatedSingleStampChanged', //cannot put in system actions, it creates chicken egg problem both files importing form each other
}

export const loadItemProperties = () => {
  return (dispatch, getState) => {
    const state = getState();
    const storeId = state.stores.selectedStoreId;
    axios.get('/api/itemProperties', { params: { storeId } }).then( ({ data }) => {
      dispatch({ type: actionTypes.ITEM_PROPERTIES_LOADED, storeId, properties: data });
    }).catch( err => err );
  }
}

export const deletePropertyValue = (storeId, propertyId, valueId) => {
  return (dispatch, getState) => {
    dispatch(showProgressBar());
    axios.post('/api/itemProperties/deletePropertyValue', { storeId, propertyId, valueId }).then( ({ data }) => {
      dispatch(hideProgressBar());
      dispatch( updateItemProperties( storeId, data.properties, data.now, data.lastAction ) );
      dispatch( showSuccess('Value deleted') );
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }
}

export const updateItemProperties = (storeId, properties, now, lastAction) => {
  return (dispatch, getState) => {
    dispatch( { type: actionTypes.ITEM_PROPERTIES_UPDATED, storeId, properties } );
    dispatch( itemPropertiesStampChanged(storeId, now) );
  }
}

export const itemPropertiesStampChanged = (storeId, newStamp) => {
  return { type: actionTypes.LAST_UPDATED_SINGLE_STAMP_CHANGED, storeId, collectionName: 'itemProperties', newStamp }
}