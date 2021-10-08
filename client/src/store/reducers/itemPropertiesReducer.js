import { actionTypes } from '../actions/itemPropertiesActions';
const initState = {}

const itemPropertiesReducer = (state = initState, action) => {
  switch(action.type)
  {
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