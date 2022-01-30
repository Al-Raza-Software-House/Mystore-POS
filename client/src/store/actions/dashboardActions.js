import axios from "axios";
import moment from "moment";
import { showError } from './alertActions';

export const actionTypes = {
  DASH_STATS_LOADED: 'dashboardStatsLoaded',
  CHANGE_STATS_PRELOADER: 'changeDashStatsPreloader'
}


export const loadStats = () => {
  return (dispatch, getState) => {
    const state = getState();
    const storeId = state.stores.selectedStoreId;
    if(!storeId) return;
    dispatch(loadingStats(storeId));
    axios.get('/api/dashboard/stats', { params: { storeId } } ).then( ({ data }) => {
      if(data.stats.dailySales)
        data.stats.dailySales = data.stats.dailySales.map(record => ({
          ...record,
          totalSaleAmount: Math.round(record.totalSaleAmount),
          totalGrossProfit: Math.round(record.totalGrossProfit),
          saleDate: moment(record.saleDate).format('DD MMM')
        }));
      data.stats.sale.today.grossProfit = Math.round(data.stats.sale.today.grossProfit);
      data.stats.sale.today.saleAmount = Math.round(data.stats.sale.today.saleAmount);

      data.stats.sale.yesterday.grossProfit = Math.round(data.stats.sale.yesterday.grossProfit);
      data.stats.sale.yesterday.saleAmount = Math.round(data.stats.sale.yesterday.saleAmount);

      dispatch({ type: actionTypes.DASH_STATS_LOADED, storeId, stats: data.stats });
      dispatch(statsLoaded(storeId));
    }).catch( err => {
      dispatch( statsLoaded(storeId) );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    });
  }
}

export const loadingStats = (storeId) => {
  return { type: actionTypes.CHANGE_STATS_PRELOADER, storeId, loading: true }
}

export const statsLoaded = (storeId) => {
  return { type: actionTypes.CHANGE_STATS_PRELOADER, storeId, loading: false }
}