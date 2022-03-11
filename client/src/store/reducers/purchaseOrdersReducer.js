import { actionTypes } from '../actions/purchaseOrderActions';
import { actionTypes as systemActions } from 'store/actions/systemActions';
const initState = { }
const defaultStorePurchaseOrders = {
  records: [],
  totalRecords: 0,
  recordsLoaded: false,
  filters: {},
  draft: null //save new Grn form 
}
const purchaseOrdersReducer = (state = initState, action) => {
  let storePOs = null;
  let newPOs = null;
  switch(action.type)
  {
    case systemActions.RESET_APP_STATE:
      return initState;
    //Transaction cases
    case actionTypes.PURCHASE_ORDERS_LOADED:
      storePOs = state[action.storeId] ? state[action.storeId] : defaultStorePurchaseOrders;
      newPOs = {
        records: [...storePOs.records, ...action.orders],
        totalRecords: action.totalRecords,
        recordsLoaded: true,
        filters: storePOs.filters,
        draft: storePOs.draft
      }
      return{
        ...state,
        [action.storeId]: newPOs
      }
    case actionTypes.PURCHASE_ORDER_ADDED:
      storePOs = state[action.storeId] ? state[action.storeId] : defaultStorePurchaseOrders;
      newPOs = {
        records: [action.order, ...storePOs.records],
        totalRecords: storePOs.totalRecords + 1,
        recordsLoaded: true,
        filters: storePOs.filters,
        draft: storePOs.draft
      }
      return{
        ...state,
        [action.storeId]: newPOs
      }
    case actionTypes.PURCHASE_ORDER_DELETED:
      storePOs = state[action.storeId] ? state[action.storeId] : defaultStorePurchaseOrders;
      newPOs = {
        records: storePOs.records.filter(record => record._id !== action.poId),
        totalRecords: storePOs.totalRecords - 1,
        recordsLoaded: storePOs.recordsLoaded,
        filters: storePOs.filters,
        draft: storePOs.draft
      }
      return{
        ...state,
        [action.storeId]: newPOs
      }
    case actionTypes.PURCHASE_ORDER_UPDATED:
      storePOs = state[action.storeId] ? state[action.storeId] : defaultStorePurchaseOrders;
      newPOs = {
        records: storePOs.records.map(record => record._id === action.poId ? action.order : record),
        totalRecords: storePOs.totalRecords,
        recordsLoaded: true,
        filters: storePOs.filters,
        draft: storePOs.draft
      }
      return{
        ...state,
        [action.storeId]: newPOs
      }
    case actionTypes.EMPTY_PURCHASE_ORDERS:
      storePOs = state[action.storeId] ? state[action.storeId] : defaultStorePurchaseOrders;
      return{
        ...state,
        [action.storeId]: {
          ...defaultStorePurchaseOrders,
          filters: storePOs.filters,
          draft: storePOs.draft
        }
      }
    case actionTypes.FILTERS_CHANGED:
      storePOs = state[action.storeId] ? state[action.storeId] : defaultStorePurchaseOrders;
      return{
        ...state,
        [action.storeId]: {
          ...defaultStorePurchaseOrders,
          filters: action.filters,
          draft: storePOs.draft
        }
      }
    case actionTypes.UPDATE_PO_DRAFT:
      storePOs = state[action.storeId] ? state[action.storeId] : defaultStorePurchaseOrders;
      return{
        ...state,
        [action.storeId]: {
          ...storePOs,
          draft: action.draft
        }
      }
    default:
      return state;
  }
}

export default purchaseOrdersReducer;