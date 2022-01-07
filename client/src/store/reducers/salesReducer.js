import { actionTypes } from '../actions/saleActions';
const initState = { }
const defaultStoreSales = {
  records: [],
  offlineRecords: [],
  totalRecords: 0,
  recordsLoaded: false,
  filters: {},
}
const salesReducer = (state = initState, action) => {
  let storeSales = null;
  let newSales = null;
  switch(action.type)
  {
    //Transaction cases
    case actionTypes.SALES_LOADED:
      storeSales = state[action.storeId] ? state[action.storeId] : defaultStoreSales;
      newSales = {
        records: [...storeSales.records, ...action.sales],
        totalRecords: action.totalRecords,
        recordsLoaded: true,
        filters: storeSales.filters,
        offlineRecords: storeSales.offlineRecords
      }
      return{
        ...state,
        [action.storeId]: newSales
      }

    case actionTypes.SALE_ADDED:
      storeSales = state[action.storeId] ? state[action.storeId] : defaultStoreSales;
      newSales = {
        records: [action.sale, ...storeSales.records],
        totalRecords: storeSales.totalRecords + 1,
        recordsLoaded: true,
        filters: storeSales.filters,
        offlineRecords: storeSales.offlineRecords
      }
      return{
        ...state,
        [action.storeId]: newSales
      }
    
    case actionTypes.OFFLINE_SALE_ADDED:
      storeSales = state[action.storeId] ? state[action.storeId] : defaultStoreSales;
      newSales = {
        records: storeSales.records,
        offlineRecords: [action.sale, ...storeSales.offlineRecords],
        totalRecords: storeSales.totalRecords,
        recordsLoaded: true,
        filters: storeSales.filters,
      }
      return{
        ...state,
        [action.storeId]: newSales
      }
    
    case actionTypes.SALE_VOIDED:
    case actionTypes.SALE_UPDATED:
      storeSales = state[action.storeId] ? state[action.storeId] : defaultStoreSales;
      newSales = {
        records: storeSales.records.map(record => record._id === action.saleId ? action.sale : record),
        totalRecords: storeSales.totalRecords,
        recordsLoaded: true,
        filters: storeSales.filters,
        offlineRecords: storeSales.offlineRecords
      }
      return{
        ...state,
        [action.storeId]: newSales
      }

    case actionTypes.OFFLINE_SALE_REMOVED:
      storeSales = state[action.storeId] ? state[action.storeId] : defaultStoreSales;
      newSales = {
        records: storeSales.records,
        totalRecords: storeSales.totalRecords,
        recordsLoaded: true,
        filters: storeSales.filters,
        offlineRecords: storeSales.offlineRecords.filter(record => record._id !== action.saleId)
      }
      return{
        ...state,
        [action.storeId]: newSales
      }

    case actionTypes.EMPTY_SALES:
      storeSales = state[action.storeId] ? state[action.storeId] : defaultStoreSales;
      return{
        ...state,
        [action.storeId]: {
          ...defaultStoreSales,
          filters: storeSales.filters,
          offlineRecords: storeSales.offlineRecords
        }
      }
    case actionTypes.FILTERS_CHANGED:
      storeSales = state[action.storeId] ? state[action.storeId] : defaultStoreSales;
      return{
        ...state,
        [action.storeId]: {
          ...defaultStoreSales,
          filters: action.filters,
          offlineRecords: storeSales.offlineRecords
        }
      }
    default:
      return state;
  }
}

export default salesReducer;