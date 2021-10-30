import { actionTypes } from '../actions/itemActions';
const initState = {}
const defaultStoreRecord = { 
       allItems: [], //master data
       filters: {},
       filteredItems: [],
       filteredItemsCount: 0,
       itemsLoaded: false
     };

let storeRecord = null;
const itemReducer = (state = initState, action) => {
  switch(action.type)
  {
    case actionTypes.ITEMS_LOADED:
     storeRecord = state[action.storeId] ? state[action.storeId] : defaultStoreRecord;
     return{
       ...state,
       [action.storeId]: {
         ...storeRecord,
         filteredItems: [...storeRecord.filteredItems, ...action.items], //append new items
         filteredItemsCount: action.totalRecords,
         itemsLoaded: true
       }
     };

    case actionTypes.EMPTY_ITEMS:
     storeRecord = state[action.storeId] ? state[action.storeId] : defaultStoreRecord;
     return{
       ...state,
       [action.storeId]: {
         ...storeRecord,
         filteredItems: [], //append new items
         filteredItemsCount: 0,
         itemsLoaded: false
       }
     }
    
    case actionTypes.MASTER_ITEMS_LOADED:
     storeRecord = state[action.storeId] ? state[action.storeId] : defaultStoreRecord;
     return{
       ...state,
       [action.storeId]: {
         ...storeRecord,
         allItems: [...storeRecord.allItems, ...action.items], //append new items
       }
     };

    case actionTypes.EMPTY_MASTER_ITEMS:
      storeRecord = state[action.storeId] ? state[action.storeId] : defaultStoreRecord;
     return{
       ...state,
       [action.storeId]: {
         ...storeRecord,
         allItems: []
       }
     }
    
    case actionTypes.SYNC_ITEMS:
     storeRecord = state[action.storeId] ? state[action.storeId] : defaultStoreRecord;
      let masterItems = [...storeRecord.allItems];
      action.items.reverse(); //keep the newly created items in of array, ,
      for(let i=0; i<action.items.length; i++)
      {
        let itemIndex = masterItems.findIndex(item => item._id === action.items[i]._id);
        if(itemIndex >= 0)
          masterItems[itemIndex] = action.items[i]; //replace/update item
        else
          masterItems = [action.items[i], ...masterItems]; //new item
      }
     return{
       ...state,
       [action.storeId]: {
         ...storeRecord,
         allItems: masterItems
       }
     }

    case actionTypes.ITEM_CREATED:
     storeRecord = state[action.storeId] ? state[action.storeId] : defaultStoreRecord;
     return{
       ...state,
       [action.storeId]: {
         ...storeRecord,
         allItems: [action.item, ...storeRecord.allItems],
         filteredItems: [action.item, ...storeRecord.filteredItems], //append new items
         filteredItemsCount: storeRecord.filteredItemsCount + 1
       }
     };

    case actionTypes.ITEM_DELETED:
     storeRecord = state[action.storeId] ? state[action.storeId] : defaultStoreRecord;
     return{
       ...state,
       [action.storeId]: {
         ...storeRecord,
         allItems: storeRecord.allItems.filter(record => record._id !== action.itemId),
         filteredItems: storeRecord.filteredItems.filter(record => record._id !== action.itemId), //append new items
         filteredItemsCount: storeRecord.filteredItemsCount - 1
       }
     };

    case actionTypes.ITEM_UPDATED:
     storeRecord = state[action.storeId] ? state[action.storeId] : defaultStoreRecord;
     return{
       ...state,
       [action.storeId]: {
         ...storeRecord,
         allItems: storeRecord.allItems.map(record => record._id === action.itemId ? action.item : record),
         filteredItems: storeRecord.filteredItems.map(record => record._id === action.itemId ? action.item : record), //append new items
       }
     };

    case actionTypes.FILTERS_CHANGED:
     storeRecord = state[action.storeId] ? state[action.storeId] : defaultStoreRecord;
     return{
       ...state,
       [action.storeId]: {
         ...storeRecord,
         filters: action.filters,
         filteredItems: [], //append new items
         filteredItemsCount: 0,
         itemsLoaded: false
       }
     }

    default:
      return state;
  }
}

export default itemReducer;