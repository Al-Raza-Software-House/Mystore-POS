import { actionTypes } from '../actions/grnActions';
import { actionTypes as systemActions } from 'store/actions/systemActions';
const initState = { }
const defaultStoreGrns = {
  records: [],
  totalRecords: 0,
  recordsLoaded: false,
  filters: {},
}
const grnsReducer = (state = initState, action) => {
  let storeGrns = null;
  let newGrns = null;
  switch(action.type)
  {
    case systemActions.RESET_APP_STATE:
      return initState;
    //Transaction cases
    case actionTypes.GRNS_LOADED:
      storeGrns = state[action.storeId] ? state[action.storeId] : defaultStoreGrns;
      newGrns = {
        records: [...storeGrns.records, ...action.grns],
        totalRecords: action.totalRecords,
        recordsLoaded: true,
        filters: storeGrns.filters
      }
      return{
        ...state,
        [action.storeId]: newGrns
      }
    case actionTypes.GRN_ADDED:
      storeGrns = state[action.storeId] ? state[action.storeId] : defaultStoreGrns;
      newGrns = {
        records: [action.grn, ...storeGrns.records],
        totalRecords: storeGrns.totalRecords + 1,
        recordsLoaded: true,
        filters: storeGrns.filters
      }
      return{
        ...state,
        [action.storeId]: newGrns
      }
    case actionTypes.GRN_DELETED:
      storeGrns = state[action.storeId] ? state[action.storeId] : defaultStoreGrns;
      newGrns = {
        records: storeGrns.records.filter(record => record._id !== action.grnId),
        totalRecords: storeGrns.totalRecords - 1,
        recordsLoaded: storeGrns.recordsLoaded,
        filters: storeGrns.filters
      }
      return{
        ...state,
        [action.storeId]: newGrns
      }
    case actionTypes.GRN_UPDATED:
      storeGrns = state[action.storeId] ? state[action.storeId] : defaultStoreGrns;
      newGrns = {
        records: storeGrns.records.map(record => record._id === action.grnId ? action.grn : record),
        totalRecords: storeGrns.totalRecords,
        recordsLoaded: true,
        filters: storeGrns.filters
      }
      return{
        ...state,
        [action.storeId]: newGrns
      }
    case actionTypes.EMPTY_GRNS:
      storeGrns = state[action.storeId] ? state[action.storeId] : defaultStoreGrns;
      return{
        ...state,
        [action.storeId]: {
          ...defaultStoreGrns,
          filters: storeGrns.filters
        }
      }
    case actionTypes.FILTERS_CHANGED:
      return{
        ...state,
        [action.storeId]: {
          ...defaultStoreGrns,
          filters: action.filters
        }
      }
    default:
      return state;
  }
}

export default grnsReducer;