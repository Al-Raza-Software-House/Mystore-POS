import { actionTypes } from '../actions/saleActions';
const initState = { }
const defaultStoreSales = {
  records: [],
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
        filters: storeSales.filters
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
        filters: storeSales.filters
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
        filters: storeSales.filters
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
          filters: storeSales.filters
        }
      }
    case actionTypes.FILTERS_CHANGED:
      return{
        ...state,
        [action.storeId]: {
          ...defaultStoreSales,
          filters: action.filters
        }
      }
    default:
      return state;
  }
}

export default salesReducer;