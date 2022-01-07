import { actionTypes } from '../actions/closingActions';
const initState = { }
const defaultStoreClosings = {
  records: [],
  totalRecords: 0,
  recordsLoaded: false,
  filters: {},
}
const closingsReducer = (state = initState, action) => {
  let storeClosings = null;
  let newClosings = null;
  switch(action.type)
  {
    //Transaction cases
    case actionTypes.CLOSINGS_LOADED:
      storeClosings = state[action.storeId] ? state[action.storeId] : defaultStoreClosings;
      newClosings = {
        records: [...storeClosings.records, ...action.closings],
        totalRecords: action.totalRecords,
        recordsLoaded: true,
        filters: storeClosings.filters
      }
      return{
        ...state,
        [action.storeId]: newClosings
      }
    case actionTypes.CLOSING_ADDED:
      storeClosings = state[action.storeId] ? state[action.storeId] : defaultStoreClosings;
      newClosings = {
        records: [action.closing, ...storeClosings.records],
        totalRecords: storeClosings.totalRecords + 1,
        recordsLoaded: true,
        filters: storeClosings.filters
      }
      return{
        ...state,
        [action.storeId]: newClosings
      }
    case actionTypes.CLOSING_DELETED:
      storeClosings = state[action.storeId] ? state[action.storeId] : defaultStoreClosings;
      newClosings = {
        records: storeClosings.records.filter(record => record._id !== action.closingId),
        totalRecords: storeClosings.totalRecords - 1,
        recordsLoaded: storeClosings.recordsLoaded,
        filters: storeClosings.filters
      }
      return{
        ...state,
        [action.storeId]: newClosings
      }
    case actionTypes.CLOSING_UPDATED:
      storeClosings = state[action.storeId] ? state[action.storeId] : defaultStoreClosings;
      newClosings = {
        records: storeClosings.records.map(record => record._id === action.closingId ? action.closing : record),
        totalRecords: storeClosings.totalRecords,
        recordsLoaded: true,
        filters: storeClosings.filters
      }
      return{
        ...state,
        [action.storeId]: newClosings
      }
    case actionTypes.EMPTY_CLOSINGS:
      storeClosings = state[action.storeId] ? state[action.storeId] : defaultStoreClosings;
      return{
        ...state,
        [action.storeId]: {
          ...defaultStoreClosings,
          filters: storeClosings.filters
        }
      }
    case actionTypes.FILTERS_CHANGED:
      return{
        ...state,
        [action.storeId]: {
          ...defaultStoreClosings,
          filters: action.filters
        }
      }
    default:
      return state;
  }
}

export default closingsReducer;