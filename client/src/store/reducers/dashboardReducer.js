import { actionTypes } from '../actions/dashboardActions';
import { actionTypes as systemActions } from 'store/actions/systemActions';
const initState = { }
const defaultStoreDashboard = {
  stats: null,
  loadingStats: false,
}
const dashboardReducer = (state = initState, action) => {
  let storeDashboard = null;
  let newDashboard = null;
  switch(action.type)
  {
    case systemActions.RESET_APP_STATE:
      return initState;
    //Transaction cases
    case actionTypes.DASH_STATS_LOADED:
      storeDashboard = state[action.storeId] ? state[action.storeId] : defaultStoreDashboard;
      newDashboard = {
        stats: action.stats,
        loadingStats: false,
      }
      return{
        ...state,
        [action.storeId]: newDashboard
      }
    case actionTypes.CHANGE_STATS_PRELOADER:
      storeDashboard = state[action.storeId] ? state[action.storeId] : defaultStoreDashboard;
      newDashboard = {
        stats: storeDashboard.stats,
        loadingStats: action.loading
      }
      return{
        ...state,
        [action.storeId]: newDashboard
      }
    default:
      return state;
  }
}

export default dashboardReducer;