import { actionTypes } from '../actions/itemActions';
import { actionTypes as systemActions } from 'store/actions/systemActions';
const initState = {}
const defaultStoreRecord = { 
    allItems: [], //master data
    filters: {},
};

let storeRecord = null;
let newItems = null;
const itemReducer = (state = initState, action) => {
  switch(action.type)
  { 
    case systemActions.RESET_APP_STATE:
      return initState;
    case actionTypes.MASTER_ITEMS_LOADED:
     storeRecord = state[action.storeId] ? state[action.storeId] : defaultStoreRecord;
     newItems = action.items.map(item => ({ ...item, itemNameLC: item.itemName.toLowerCase(), itemCodeLC: (item.sizeId ? `${item.itemCode}-${item.sizeCode}-${item.combinationCode}` : item.itemCode ).toLowerCase() }))
     return{
       ...state,
       [action.storeId]: {
         ...storeRecord,
         allItems: [...storeRecord.allItems, ...newItems], //append new items
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
      newItems = action.items.map(item => ({ ...item, itemNameLC: item.itemName.toLowerCase(), itemCodeLC: (item.sizeId ? `${item.itemCode}-${item.sizeCode}-${item.combinationCode}` : item.itemCode ).toLowerCase() }))
      newItems.reverse(); //keep the newly created items in of array, ,
      for(let i=0; i<newItems.length; i++)
      {
        let record = newItems[i];
        let itemIndex = masterItems.findIndex(item => item._id === record._id);
        if(itemIndex >= 0)
          masterItems[itemIndex] = record; //replace/update item
        else
          masterItems = [record, ...masterItems]; //new item
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
      let newItem = {...action.item, itemNameLC: action.item.itemName.toLowerCase(), itemCodeLC: (action.item.sizeId ? `${action.item.itemCode}-${action.item.sizeCode}-${action.item.combinationCode}` : action.item.itemCode ).toLowerCase()}
      let newPackings = action.item.packings.map(item => ({ ...item, itemNameLC: item.itemName.toLowerCase(), itemCodeLC: (item.sizeId ? `${item.itemCode}-${item.sizeCode}-${item.combinationCode}` : item.itemCode ).toLowerCase() }))
      let newVariants = action.item.variants.map(item => ({ ...item, itemNameLC: item.itemName.toLowerCase(), itemCodeLC: (item.sizeId ? `${item.itemCode}-${item.sizeCode}-${item.combinationCode}` : item.itemCode ).toLowerCase() }))
      
     return{
       ...state,
       [action.storeId]: {
         ...storeRecord,
         allItems: [newItem, ...newPackings, ...newVariants, ...storeRecord.allItems]
       }
     };

    case actionTypes.ITEM_DELETED:
     storeRecord = state[action.storeId] ? state[action.storeId] : defaultStoreRecord;
     return{
       ...state,
       [action.storeId]: {
         ...storeRecord,
         allItems: storeRecord.allItems.filter(record => record._id !== action.itemId && record.packParentId !== action.itemId && record.varientParentId !== action.itemId ), //remove item, all it's packings and variants
       }
     };

    case actionTypes.ITEM_UPDATED:
      storeRecord = state[action.storeId] ? state[action.storeId] : defaultStoreRecord;
      let newMasterItems = [...storeRecord.allItems];
      newMasterItems = newMasterItems.filter(item => action.deletedSubItems.indexOf(item._id) === -1 ); //remove deleted variants or packs first

      action.item = {...action.item, itemNameLC: action.item.itemName.toLowerCase(), itemCodeLC: (action.item.sizeId ? `${action.item.itemCode}-${action.item.sizeCode}-${action.item.combinationCode}` : action.item.itemCode ).toLowerCase()}
      action.item.packings = action.item.packings.map(item => ({ ...item, itemNameLC: item.itemName.toLowerCase(), itemCodeLC: (item.sizeId ? `${item.itemCode}-${item.sizeCode}-${item.combinationCode}` : item.itemCode ).toLowerCase() }))
      action.item.variants = action.item.variants.map(item => ({ ...item, itemNameLC: item.itemName.toLowerCase(), itemCodeLC: (item.sizeId ? `${item.itemCode}-${item.sizeCode}-${item.combinationCode}` : item.itemCode ).toLowerCase() }))
      for(let i=0; i<action.item.packings.length; i++)
      {
        let packIndex = newMasterItems.findIndex(item => item._id === action.item.packings[i]._id);
        if(packIndex === -1) //new packing added
          newMasterItems = [action.item.packings[i], ...newMasterItems];
        else
          newMasterItems[packIndex] = action.item.packings[i];
      }
      for(let i=0; i<action.item.variants.length; i++)
      {
        let variantIndex = newMasterItems.findIndex(item => item._id === action.item.variants[i]._id);
        if(variantIndex === -1) //new packing added
          newMasterItems = [action.item.variants[i], ...newMasterItems];
        else
          newMasterItems[variantIndex] = action.item.variants[i];
      }
      let parentItemIndex = newMasterItems.findIndex(item => item._id === action.item._id); //check if parent item/variant changed
      if(parentItemIndex === -1) //parent item is newly created variant
        newMasterItems = [action.item, ...newMasterItems];
      else
        newMasterItems[parentItemIndex] = action.item; //replace parent item with update record
      return{
        ...state,
        [action.storeId]: {
          ...storeRecord,
          allItems: newMasterItems
        }
      };
    case actionTypes.ITEM_SIZE_NAME_UPDATED:
     storeRecord = state[action.storeId] ? state[action.storeId] : defaultStoreRecord;
     return{
       ...state,
       [action.storeId]: {
         ...storeRecord,
         allItems: storeRecord.allItems.map(record => record.sizeId === action.sizeId ? { ...record, sizeCode: action.sizeCode, sizeName: action.sizeName } : record)
       }
     };

    case actionTypes.ITEM_COMBINATION_NAME_UPDATED:
     storeRecord = state[action.storeId] ? state[action.storeId] : defaultStoreRecord;
     return{
       ...state,
       [action.storeId]: {
         ...storeRecord,
         allItems: storeRecord.allItems.map(record => record.combinationId === action.combinationId ? { ...record, combinationCode: action.combinationCode, combinationName: action.combinationName } : record)
       }
     };

    case actionTypes.FILTERS_CHANGED:
     storeRecord = state[action.storeId] ? state[action.storeId] : defaultStoreRecord;
     return{
       ...state,
       [action.storeId]: {
         ...storeRecord,
         filters: action.filters
       }
     }

    default:
      return state;
  }
}

export default itemReducer;