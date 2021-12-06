import { actionTypes } from '../actions/purchaseOrderActions';
const initState = { }
const defaultStorePurchaseOrders = {
  records: [],
  totalRecords: 0,
  recordsLoaded: false,
  filters: {},
}
const purchaseOrdersReducer = (state = initState, action) => {
  let storePOs = null;
  let newPOs = null;
  switch(action.type)
  {
    //Transaction cases
    case actionTypes.PURCHASE_ORDERS_LOADED:
      storePOs = state[action.storeId] ? state[action.storeId] : defaultStorePurchaseOrders;
      newPOs = {
        records: [...storePOs.records, ...action.orders],
        totalRecords: action.totalRecords,
        recordsLoaded: true,
        filters: storePOs.filters
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
        filters: storePOs.filters
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
        filters: storePOs.filters
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
        filters: storePOs.filters
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
          filters: storePOs.filters
        }
      }
    case actionTypes.FILTERS_CHANGED:
      return{
        ...state,
        [action.storeId]: {
          ...defaultStorePurchaseOrders,
          filters: action.filters
        }
      }
    default:
      return state;
  }
}

export default purchaseOrdersReducer;