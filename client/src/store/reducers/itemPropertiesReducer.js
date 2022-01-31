import { actionTypes } from '../actions/itemPropertiesActions';
import { actionTypes as systemActions } from 'store/actions/systemActions';
const initState = {}

const itemPropertiesReducer = (state = initState, action) => {
  switch(action.type)
  {
    case systemActions.RESET_APP_STATE:
      return initState;
    case actionTypes.ITEM_PROPERTIES_LOADED:
    case actionTypes.ITEM_PROPERTIES_UPDATED:
      return{
        ...state,
        [action.storeId]: action.properties
      }
    default:
      return state;
  }
}

export default itemPropertiesReducer;