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
    case actionTypes.VIDEO_DELETED:
      const newVideos = state.videos.filter(element => element._id !== action.videoId)
      return{
        ...state,
        videos: newVideos,
      }
    default:
      return state;
  }
}

export default helpReducer;