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