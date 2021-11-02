import axios from "axios";
import { hideProgressBar, showProgressBar } from "./progressActions"

export const actionTypes = {
  VIDEOS_LOADED: 'videosLoaded',
  VIDEO_DELETED: 'videoDeleted'
}

//on page load
export const loadVideos = () => {
  return (dispatch, getState) => {
    const state = getState();
    if(state.help.videos.length !== 0) return; //videos already loaded
      dispatch(showProgressBar());
    axios.get('/api/help/videos').then( ({ data }) => {
      const state = getState();
      if(state.help.videos.length === 0)
        dispatch(hideProgressBar());
      dispatch({ type: actionTypes.VIDEOS_LOADED, videos: data });
    }).catch( err => {
       dispatch(hideProgressBar());
      return err
    } );
  }
}

export const syncVideos = () => {
  return (dispatch, getState) => {
    axios.get('/api/help/videos').then( ({ data }) => {
      dispatch({ type: actionTypes.VIDEOS_LOADED, videos: data });
    }).catch( err => {
       dispatch(hideProgressBar());
      return err
    } );
  }
}