import axios from "axios";
import { showError, showSuccess } from './alertActions';
import { hideProgressBar, showProgressBar } from "./progressActions"

export const actionTypes = {
  LAST_END_OF_DAY_UPDATED: 'lastEndOfDayUpdated',
}

export const loadAdjustmentReasons = () => {
  return (dispatch, getState) => {
    const state = getState();
    const storeId = state.stores.selectedStoreId;
    axios.get('/api/adjustmentReasons', { params: { storeId } }).then( ({ data }) => {
      dispatch({ type: actionTypes.ADJUST_REASONS_LOADED, storeId, reasons: data });
    }).catch( err => err );
  }
}

export const createAdjustmentReason = (storeId, reason,  now, lastAction) => {
  return (dispatch, getState) => {
    const state = getState();
    
    const reduxLastAction = state.system.lastUpdatedStamps[storeId].adjustmentReasons;
    if(reduxLastAction !== lastAction) //there are some updates by other device after last sync
      dispatch( loadAdjustmentReasons() );
    else // no changes by other device after last sync
      dispatch( { type: actionTypes.ADJUST_REASON_CREATED, storeId, reason } );
    dispatch( adjustmentReasonsStampChanged(storeId, now) );
  }
}

export const deleteAdjustmentReason = (storeId, reasonId) => {
  return (dispatch, getState) => {
    dispatch(showProgressBar());
    axios.post('/api/adjustmentReasons/delete', { storeId, reasonId }).then( ({ data }) => {
      dispatch(hideProgressBar());
      const state = getState();
      const reduxLastAction = state.system.lastUpdatedStamps[storeId].deleteActivity;
      if(reduxLastAction === data.lastAction) //no delete activity after last sycn
        dispatch({ type: actionTypes.LAST_UPDATED_SINGLE_STAMP_CHANGED, storeId, collectionName: 'deleteActivity', newStamp: data.now });
      dispatch( { type: actionTypes.ADJUST_REASON_DELETED, storeId, reasonId } );
      dispatch( showSuccess('Adjustment reason deleted') );
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }
}

export const updateAdjustmentReason = (storeId, reasonId, reason, now, lastAction) => {
  return (dispatch, getState) => {
    const state = getState();
    const reduxLastAction = state.system.lastUpdatedStamps[storeId].adjustmentReasons;
    if(reduxLastAction !== lastAction) //there are some updates by other device after last sync
      dispatch( loadAdjustmentReasons() );
    else // no changes by other device after last sync
      dispatch( { type: actionTypes.ADJUST_REASON_UPDATED, storeId, reasonId, reason } );
    dispatch( adjustmentReasonsStampChanged(storeId, now) );
  }
}

export const adjustmentReasonsStampChanged = (storeId, newStamp) => {
  return { type: actionTypes.LAST_UPDATED_SINGLE_STAMP_CHANGED, storeId, collectionName: 'adjustmentReasons', newStamp }
}

//goes to store reducer to update last day closed time stamp in store object
