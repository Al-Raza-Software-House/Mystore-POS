import { actionTypes } from '../actions/progressActions';
const initState = {  loading: false }

const progressReducer = (state = initState, action) => {
  switch(action.type)
  {
    case actionTypes.LOADING:
      return {
        ...state,
        loading: true,
      }
    case actionTypes.LOADED:
      return {
        ...state,
        loading: false,
      } 
    default:
      return state;
  }
}

export default progressReducer;