import { actionTypes } from '../actions/rtvActions';
import { actionTypes as systemActions } from 'store/actions/systemActions';
const initState = { }
const defaultStoreRtvs = {
  records: [],
  totalRecords: 0,
  recordsLoaded: false,
  filters: {},
  draft: null //save new Grn form 
}
const rtvsReducer = (state = initState, action) => {
  let storeRtvs = null;
  let newRtvs = null;
  switch(action.type)
  {
    case systemActions.RESET_APP_STATE:
      return initState;
    //Transaction cases
    case actionTypes.RTVS_LOADED:
      storeRtvs = state[action.storeId] ? state[action.storeId] : defaultStoreRtvs;
      newRtvs = {
        records: [...storeRtvs.records, ...action.rtvs],
        totalRecords: action.totalRecords,
        recordsLoaded: true,
        filters: storeRtvs.filters,
        draft: storeRtvs.draft
      }
      return{
        ...state,
        [action.storeId]: newRtvs
      }
    case actionTypes.RTV_ADDED:
      storeRtvs = state[action.storeId] ? state[action.storeId] : defaultStoreRtvs;
      newRtvs = {
        records: [action.rtv, ...storeRtvs.records],
        totalRecords: storeRtvs.totalRecords + 1,
        recordsLoaded: true,
        filters: storeRtvs.filters,
        draft: storeRtvs.draft
      }
      return{
        ...state,
        [action.storeId]: newRtvs
      }
    case actionTypes.RTV_DELETED:
      storeRtvs = state[action.storeId] ? state[action.storeId] : defaultStoreRtvs;
      newRtvs = {
        records: storeRtvs.records.filter(record => record._id !== action.rtvId),
        totalRecords: storeRtvs.totalRecords - 1,
        recordsLoaded: storeRtvs.recordsLoaded,
        filters: storeRtvs.filters,
        draft: storeRtvs.draft
      }
      return{
        ...state,
        [action.storeId]: newRtvs
      }
    case actionTypes.RTV_UPDATED:
      storeRtvs = state[action.storeId] ? state[action.storeId] : defaultStoreRtvs;
      newRtvs = {
        records: storeRtvs.records.map(record => record._id === action.rtvId ? action.rtv : record),
        totalRecords: storeRtvs.totalRecords,
        recordsLoaded: true,
        filters: storeRtvs.filters,
        draft: storeRtvs.draft
      }
      return{
        ...state,
        [action.storeId]: newRtvs
      }
    case actionTypes.EMPTY_RTVS:
      storeRtvs = state[action.storeId] ? state[action.storeId] : defaultStoreRtvs;
      return{
        ...state,
        [action.storeId]: {
          ...defaultStoreRtvs,
          filters: storeRtvs.filters,
          draft: storeRtvs.draft
        }
      }
    case actionTypes.FILTERS_CHANGED:
      storeRtvs = state[action.storeId] ? state[action.storeId] : defaultStoreRtvs;
      return{
        ...state,
        [action.storeId]: {
          ...defaultStoreRtvs,
          filters: action.filters,
          draft: storeRtvs.draft
        }
      }
    case actionTypes.UPDATE_RTV_DRAFT:
      storeRtvs = state[action.storeId] ? state[action.storeId] : defaultStoreRtvs;
      return{
        ...state,
        [action.storeId]: {
          ...storeRtvs,
          draft: action.draft
        }
      }
    default:
      return state;
  }
}

export default rtvsReducer;