import { actionTypes } from '../actions/adjustmentReasonActions';
import { actionTypes as systemActions } from 'store/actions/systemActions';
const initState = {
}

const adjustmentReasonsReducer = (state = initState, action) => {
  let reasons = null;
  switch(action.type)
  {
    case systemActions.RESET_APP_STATE:
      return initState;
    case actionTypes.ADJUST_REASONS_LOADED:
      return{
        ...state,
        [action.storeId]: action.reasons
      }
    case actionTypes.ADJUST_REASON_CREATED:
      reasons = state[action.storeId] ? state[action.storeId] : [];
      return{
        ...state,
         [action.storeId]: [action.reason, ...reasons]
      }
    case actionTypes.ADJUST_REASON_UPDATED:
      reasons = state[action.storeId] ? state[action.storeId] : [];
      reasons = reasons.map(item => item._id === action.reasonId ? action.reason : item);
      return{
        ...state,
         [action.storeId]: [...reasons]
      }
    case actionTypes.ADJUST_REASON_DELETED:
      reasons = state[action.storeId] ? state[action.storeId] : [];
      reasons = reasons.filter(item => item._id !== action.reasonId);
      return{
        ...state,
         [action.storeId]: [...reasons]
      }
    default:
      return state;
  }
}

export default adjustmentReasonsReducer;