import { actionTypes } from '../actions/helpActions';
const initState = {
  videos: [],
  allLoaded: false
}

const helpReducer = (state = initState, action) => {
  switch(action.type)
  {
    case actionTypes.VIDEOS_LOADED:
      return{
        ...state,
        videos: action.videos,
        allLoaded: true
      }
    default:
      return state;
  }
}

export default helpReducer;