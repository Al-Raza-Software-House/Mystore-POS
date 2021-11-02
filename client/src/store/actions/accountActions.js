import axios from "axios";
import { showError, showSuccess } from './alertActions';
import { hideProgressBar, showProgressBar } from "./progressActions"

export const actionTypes = {
  ACCOUNT_HEADS_LOADED: 'accountHeadsLoaded',
  ACCOUNT_HEAD_CREATED: 'accountHeadCreated',
  ACCOUNT_HEAD_DELETED: 'accountHeadDeleted',
  ACCOUNT_HEAD_UPDATED: 'accountHeadUpdated',

  BANKS_LOADED: 'banksLoaded',
  BANK_CREATED: 'bankCreated',
  BANK_UPDATED: 'bankUpdated',
  BANK_DELETED: 'bankDeleted',

  LAST_UPDATED_SINGLE_STAMP_CHANGED: 'lastUpdatedSingleStampChanged', //cannot put in system actions, it creates chicken egg problem both files importing form each other
}

export const loadAccountHeads = () => {
  return (dispatch, getState) => {
    const state = getState();
    const storeId = state.stores.selectedStoreId;
    axios.get('/api/accounts/heads', { params: { storeId } }).then( ({ data }) => {
      dispatch({ type: actionTypes.ACCOUNT_HEADS_LOADED, storeId, heads: data });
    }).catch( err => err );
  }
}

export const createHead = (storeId, head, now, lastAction) => {
  return (dispatch, getState) => {
    const state = getState();
    
    const reduxLastAction = state.system.lastUpdatedStamps[storeId].accountHeads;
    if(reduxLastAction !== lastAction) //there are some updates by other device after last sync
      dispatch( loadAccountHeads() );
    else // no changes by other device after last sync
      dispatch( { type: actionTypes.ACCOUNT_HEAD_CREATED, storeId, head } );
    dispatch( accountHeadsStampChanged(storeId, now) );
  }
}

export const deleteHead = (storeId, headId) => {
  return (dispatch, getState) => {
    dispatch(showProgressBar());
    axios.post('/api/accounts/heads/delete', { storeId, headId }).then( ({ data }) => {
      dispatch(hideProgressBar());
      
      const state = getState();
      const reduxLastAction = state.system.lastUpdatedStamps[storeId].deleteActivity;
      if(reduxLastAction === data.lastAction) //no delete activity after last sycn
        dispatch({ type: actionTypes.LAST_UPDATED_SINGLE_STAMP_CHANGED, storeId, collectionName: 'deleteActivity', newStamp: data.now });

      dispatch( { type: actionTypes.ACCOUNT_HEAD_DELETED, storeId, headId } );
      dispatch( showSuccess('Account head deleted') );
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }
}

export const updateHead = (storeId, headId, head, now, lastAction) => {
  return (dispatch, getState) => {
    const state = getState();
    
    const reduxLastAction = state.system.lastUpdatedStamps[storeId].accountHeads;
    if(reduxLastAction !== lastAction) //there are some updates by other device after last sync
      dispatch( loadAccountHeads() );
    else // no changes by other device after last sync
      dispatch( { type: actionTypes.ACCOUNT_HEAD_UPDATED, storeId, headId, head } );
    dispatch( accountHeadsStampChanged(storeId, now) );
  } 
}


export const loadBanks = () => {
  return (dispatch, getState) => {
    const state = getState();
    const storeId = state.stores.selectedStoreId;
    axios.get('/api/accounts/banks', { params: { storeId } }).then( ({ data }) => {
      dispatch({ type: actionTypes.BANKS_LOADED, storeId, banks: data });
    }).catch( err => err );
  }
}

export const createBank = (storeId, bank, now, lastAction) => {
  return (dispatch, getState) => {
    const state = getState();
    
    const reduxLastAction = state.system.lastUpdatedStamps[storeId].banks;
    if(reduxLastAction !== lastAction) //there are some updates by other device after last sync
      dispatch( loadBanks() );
    else // no changes by other device after last sync
      dispatch( { type: actionTypes.BANK_CREATED, storeId, bank } );
    dispatch( banksStampChanged(storeId, now) );
  }
}

export const deleteBank = (storeId, bankId) => {
  return (dispatch, getState) => {
    dispatch(showProgressBar());
    axios.post('/api/accounts/banks/delete', { storeId, bankId }).then( ({ data }) => {
      dispatch(hideProgressBar());

      const state = getState();
      const reduxLastAction = state.system.lastUpdatedStamps[storeId].deleteActivity;
      if(reduxLastAction === data.lastAction) //no delete activity after last sycn
        dispatch({ type: actionTypes.LAST_UPDATED_SINGLE_STAMP_CHANGED, storeId, collectionName: 'deleteActivity', newStamp: data.now });
        
      dispatch( { type: actionTypes.BANK_DELETED, storeId, bankId } );
      dispatch( showSuccess('Bank deleted') );
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }
}

export const updateBank = (storeId, bankId, bank, now, lastAction) => {
  return (dispatch, getState) => {
    const state = getState();
    const reduxLastAction = state.system.lastUpdatedStamps[storeId].banks;
    if(reduxLastAction !== lastAction) //there are some updates by other device after last sync
      dispatch( loadBanks() );
    else // no changes by other device after last sync
      dispatch( { type: actionTypes.BANK_UPDATED, storeId, bankId, bank } );
    dispatch( banksStampChanged(storeId, now) );
  }
}

export const banksStampChanged = (storeId, newStamp) => {
  return { type: actionTypes.LAST_UPDATED_SINGLE_STAMP_CHANGED, storeId, collectionName: 'banks', newStamp }
}

export const accountHeadsStampChanged = (storeId, newStamp) => {
  return { type: actionTypes.LAST_UPDATED_SINGLE_STAMP_CHANGED, storeId, collectionName: 'accountHeads', newStamp }
}