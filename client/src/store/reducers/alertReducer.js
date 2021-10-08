import { actionTypes } from '../actions/alertActions';
const initState = {  
  success: null,
  error: null,
  info: null,
  warning: null,
}

const alertReducer = (state = initState, action) => {
  switch(action.type)
  {
    case actionTypes.SHOW_SUCCESS:
      return {
        ...state,
        success: action.message,
      }
    case actionTypes.SHOW_ERROR:
      return {
        ...state,
        error: action.message,
      }
    case actionTypes.SHOW_INFO:
      return {
        ...state,
        info: action.message,
      }
    case actionTypes.SHOW_WARNING:
      return {
        ...state,
        warning: action.message,
      }
    case actionTypes.CLEAR_ALERT:
      return initState;
    default:
      return state;
  }
}

export default alertReducer;