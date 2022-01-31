import { actionTypes } from '../actions/systemActions';
import * as storage from 'redux-storage';

const initState = {
  appVersion: null,
  masterDataLoaded:{ }, //flag for each store
  lastUpdatedStamps: { }, //las updated timestamps of data collections for each store
  syncinProgress: false, //  show sync dialog,
  syncStatus: "", // show status i.e Loading categories...,
  online: true, //check if there is an internet connection,
  pinging: false
}

const systemReducer = (state = initState, action) => {
  switch(action.type)
  {
    case actionTypes.RESET_APP_STATE:
      return initState;
    case actionTypes.APP_VERSION_CHANGED:
      return{
        ...state,
        appVersion: action.appVersion
      }
    case actionTypes.ONLINE_STATUS_CHANGED:
      return{
        ...state,
        online: action.status
      }
    case actionTypes.MASTER_DATA_LOADED:
      return{
        ...state,
        masterDataLoaded:{
          ...state.masterDataLoaded,
          [action.storeId]: true //this store's master data loaded
        }
      }
    case actionTypes.LAST_UPDATED_STAMPS_CHANGED:
      return {
        ...state,
        lastUpdatedStamps:{
          ...state.lastUpdatedStamps,
          [action.storeId]: action.lastUpdatedStamps
        }
      }
    case actionTypes.LAST_UPDATED_SINGLE_STAMP_CHANGED:
      return {
        ...state,
        lastUpdatedStamps:{
          ...state.lastUpdatedStamps, //other stores stamps
          [action.storeId]: {
            ...state.lastUpdatedStamps[action.storeId], //spread other stamps of same store
            [action.collectionName]: action.newStamp
          }
        }
      }
    case actionTypes.DATA_SYNC_STARTED:
      return{
        ...state,
        syncinProgress: true
      }
    case actionTypes.DATA_SYNC_STOPPED:
      return{
        ...state,
        syncinProgress: false,
        syncStatus: ""
      }
    case actionTypes.PING_STARTED:
      return{
        ...state,
        pinging: true
      }
    case actionTypes.PING_STOPPED:
      return{
        ...state,
        pinging: false
      }
    
    case actionTypes.SYNC_STATUS_UPDATED:
      return{
        ...state,
        syncStatus: action.text
      }
    case storage.LOAD: //when data is loaded from INDEXED DB, reset flags
      return {
        ...state,
        syncinProgress: false,
        syncStatus: ""
      }
    default:
      return state;
  }
}

export default systemReducer;