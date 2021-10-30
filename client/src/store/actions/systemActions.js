import axios from "axios";
import { loadSelectedStore, selectStore, updateStore } from "./storeActions";
import { actionTypes as accountActions, loadAccountHeads, loadBanks } from "./accountActions";
import { actionTypes as adjustmentReasonActions, loadAdjustmentReasons } from "./adjustmentReasonActions";
import { actionTypes as categoryActions, loadCategories } from "./categoryActions";
import { actionTypes as customerActions, syncCustomers } from "./customerActions";
import { actionTypes as helpActions, loadVideos } from "./helpActions";
import { actionTypes as itemActions, syncItems } from "./itemActions";
import { actionTypes as itemPropertiesActions, loadItemProperties } from "./itemPropertiesActions";
import { actionTypes as supplierActions, syncSuppliers } from "./supplierActions";

export const actionTypes = {
  MASTER_DATA_LOADED: 'masterDataLoaded',
  APP_VERSION_CHANGED: 'appVersionChanged',
  LAST_UPDATED_STAMPS_CHANGED: 'lastUpdatedStampsChanged',
  DATA_SYNC_STARTED: 'dataSyncStarted',
  DATA_SYNC_STOPPED: 'dataSyncStopped',
  SYNC_STATUS_UPDATED: 'syncStatusUpdated',
  LAST_UPDATED_SINGLE_STAMP_CHANGED: 'lastUpdatedSingleStampChanged'
}

const deleteActionsMap = {
  videos: (storeId, videoId) => ({ type: helpActions.VIDEO_DELETED, videoId }), //re-loads all
  categories: (storeId, categoryId) => ({ type: categoryActions.CATEGORY_DELETED, storeId, categoryId }), //re-loads all
  items: (storeId, itemId) => ({ type: itemActions.ITEM_DELETED, storeId, itemId }), //load only changed/new items
  adjustmentReasons: (storeId, reasonId) => ({ type: adjustmentReasonActions.ADJUST_REASON_DELETED, storeId, reasonId }), //re-loads all
  suppliers: (storeId, supplierId) => ({ type: supplierActions.SUPPLIER_DELETED, storeId, supplierId }),  //load only changed/new suppliers
  customers: (storeId, customerId) => ({ type: customerActions.CUSTOMER_DELETED, storeId, customerId }), // load only changed/new customers
  banks: (storeId, bankId) => ({ type: accountActions.BANK_DELETED, storeId, bankId }), //re-loads all
  accountHeads: (storeId, headId) => ({ type: accountActions.ACCOUNT_HEAD_DELETED, storeId, headId }), //re-loads all
}

export const syncDeleteActivity = (lastUpatedStamp) => {
  return async (dispatch, getState) => {
    const storeId = getState().stores.selectedStoreId;
    try
    {
      const result = await axios.get('/api/stores/deleteActivity', { params: { storeId, after: lastUpatedStamp } });
      for(let i=0; i<result.data.length; i++)
      {
        let { recordId, collectionName } = result.data[i];
        if(deleteActionsMap[collectionName])
          dispatch( deleteActionsMap[collectionName](storeId, recordId) );
      }
    }catch(err)
    {

    }
  }
}

//in case of new records added or old records update
const syncActionsMap = {
  stores: loadSelectedStore, //re-loads selected store
  videos: loadVideos, //re-loads all
  itemProperties: loadItemProperties, //re-loads all
  categories: loadCategories, //re-loads all
  items: syncItems, //load only changed/new items
  adjustmentReasons: loadAdjustmentReasons, //re-loads all
  suppliers: syncSuppliers,  //load only changed/new suppliers
  customers: syncCustomers, // load only changed/new customers
  banks: loadBanks, //re-loads all
  accountHeads: loadAccountHeads, //re-loads all
  deleteActivity: syncDeleteActivity //get all delete activity records and process
}

//look of db changes every X seconds to sync local redux store and Indexed DB
export const syncData = () => {
  return (dispatch, getState) => {
    const state = getState();
    const storeId = state.stores.selectedStoreId;
    if(!storeId) return null;
    if(state.system.syncinProgress) return; //A sync is already in progress;
    if(!state.system.masterDataLoaded[storeId])
    {
      dispatch(loadMasterData());
      return;
    }
    let lastTimestamps = state.system.lastUpdatedStamps[storeId] ? { ...state.system.lastUpdatedStamps[storeId] }: {};
    axios.get('/api/stores/getUpdateTimestamps', {params: { storeId }}).then( ({ data }) => {
      if(!data.storeId) //store deleted or user access removed
      {
        dispatch( selectStore(null, null) );
        return;
      }
      dispatch( lastUpdatedStampsChanged(storeId, data.dataUpdated) );//get old stamps first from redux then put new
      for(let key in syncActionsMap)
      {
        if(lastTimestamps[key] !== data.dataUpdated[key] && syncActionsMap[key]) //if system stamp doesn't match with server stamp, sync data
          dispatch( syncActionsMap[key](  lastTimestamps[key]  ) );
      }
    }).catch( err => err );
  }
}

export const loadMasterData = () => {
  return async (dispatch, getState) => {
    let state = getState();
    const storeId = state.stores.selectedStoreId;
    if(!storeId) return null;
    if(state.system.syncinProgress) return; //A sync is already in progress;
    if(state.system.masterDataLoaded[storeId]) return;
    dispatch( startSync() );
    try
    {
      let result = null;

      dispatch( syncStatusUpdated("Updating store...") );
      result = await axios.get('/api/stores', { params: { storeId } });
      dispatch( updateStore( storeId, result.data ) );
      dispatch( lastUpdatedStampsChanged(storeId, result.data.dataUpdated) );

      dispatch( syncStatusUpdated("Loading banks...") );
      result = await axios.get('/api/accounts/banks', { params: { storeId } });
      dispatch({ type: accountActions.BANKS_LOADED, storeId, banks: result.data });

      dispatch( syncStatusUpdated("Loading account heads...") );
      result = await axios.get('/api/accounts/accountHeads', { params: { storeId } });
      dispatch({ type: accountActions.ACCOUNT_HEADS_LOADED, storeId, heads: result.data });

      dispatch( syncStatusUpdated("Loading categories...") );
      result = await axios.get('/api/categories', { params: { storeId } });
      dispatch({ type: categoryActions.CATEGORIES_LOADED, storeId, categories: result.data });

      dispatch( syncStatusUpdated("Loading item properties...") );
      result = await axios.get('/api/itemProperties', { params: { storeId } });
      dispatch({ type: itemPropertiesActions.ITEM_PROPERTIES_LOADED, storeId, properties: result.data });

      dispatch( syncStatusUpdated("Loading adjustment reasons...") );
      result = await axios.get('/api/adjustmentReasons', { params: { storeId } });
      dispatch({ type: adjustmentReasonActions.ADJUST_REASONS_LOADED, storeId, reasons: result.data });


      //Loading items
      dispatch({ type: itemActions.EMPTY_MASTER_ITEMS, storeId }); //reset items to avoid duplicate reocrds in case master data sync is interrupted
      do
      {
        state = getState();
        let currentItems = state.items[storeId] ? state.items[storeId].allItems : [];
        if(result.data.totalRecords)
          dispatch( syncStatusUpdated("Loading items ("+ currentItems.length + '/' + result.data.totalRecords + ")..."  ) );
        else
          dispatch( syncStatusUpdated("Loading items...") );
        result = await axios.get('/api/items/allItems', { params: { storeId, skip: currentItems.length } });
        dispatch({ type: itemActions.MASTER_ITEMS_LOADED, storeId, items: result.data.items });
      }while(result.data.hasMoreRecords)

      result = null;
      //Loading suppliers
      dispatch({ type: supplierActions.EMPTY_SUPPLIERS, storeId }); //reset suppliers to avoid duplicate reocrds in case master data sync is interrupted
      do
      {
        state = getState();
        let currentSuppliers = state.suppliers[storeId] ? state.suppliers[storeId] : [];
        if(result &&  result.data.totalRecords)
          dispatch( syncStatusUpdated("Loading suppliers ("+ currentSuppliers.length + '/' + result.data.totalRecords + ")..."  ) );
        else
          dispatch( syncStatusUpdated("Loading suppliers...") );
        result = await axios.get('/api/suppliers', { params: { storeId, skip: currentSuppliers.length } });
        dispatch({ type: supplierActions.SUPPLIERS_LOADED, storeId, suppliers: result.data.suppliers });
      }while(result.data.hasMoreRecords)

      result = null;
      //Loading customers
      dispatch({ type: customerActions.EMPTY_CUSTOMERS, storeId }); //reset suppliers to avoid duplicate reocrds in case master data sync is interrupted
      do
      {
        state = getState();
        let currentCustomers = state.customers[storeId] ? state.customers[storeId] : [];
        if(result &&  result.data.totalRecords)
          dispatch( syncStatusUpdated("Loading customers ("+ currentCustomers.length + '/' + result.data.totalRecords + ")..."  ) );
        else
          dispatch( syncStatusUpdated("Loading customers...") );
        result = await axios.get('/api/customers', { params: { storeId, skip: currentCustomers.length } });
        dispatch({ type: customerActions.CUSTOMERS_LOADED, storeId, customers: result.data.customers });
      }while(result.data.hasMoreRecords)
      
      dispatch( syncStatusUpdated("Updating help videos...") );
      result = await axios.get('/api/help/videos');
      dispatch({ type: helpActions.VIDEOS_LOADED, videos: result.data });

      dispatch( masterDataLoaded(storeId) );
      dispatch( stopSync() );
    }catch(err) {
      dispatch( stopSync() );
    }
  }
}

export const masterDataLoaded = (storeId) => {
  return { type: actionTypes.MASTER_DATA_LOADED, storeId }
}

export const appVersionChanged = (appVersion) => {
  return { type: actionTypes.APP_VERSION_CHANGED, appVersion }
}

export const lastUpdatedStampsChanged = (storeId, lastUpdatedStamps) => {
  return { type: actionTypes.LAST_UPDATED_STAMPS_CHANGED, storeId, lastUpdatedStamps }
}

export const startSync = () => {
  return { type: actionTypes.DATA_SYNC_STARTED }
}

export const stopSync = () => {
  return { type: actionTypes.DATA_SYNC_STOPPED }
}

export const syncStatusUpdated = (text) => {
  return { type: actionTypes.SYNC_STATUS_UPDATED, text }
}