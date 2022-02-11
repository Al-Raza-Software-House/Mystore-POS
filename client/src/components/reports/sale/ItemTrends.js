import React, { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import { Box, Button, Typography } from '@material-ui/core';
import { connect } from 'react-redux';
import moment from 'moment';
import DateRangeFilter from '../../library/form/DateRangeFilter';
import axios from 'axios';
import { hideProgressBar, showProgressBar } from '../../../store/actions/progressActions';
import { showError } from '../../../store/actions/alertActions';
import ReactGA from "react-ga4";
import SelectItem from 'components/library/SelectItem';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const defaultStats = {
    totalQuantity: 0,
    totalSale: 0,
    totalProfit: 0
  }

function ItemTrends({ storeId, loadingRecords, dispatch }) {
  const [dateRange, setDateRange] = useState(() => {
    return moment().subtract(30, 'days').format("DD MMM, YYYY") + " - " + moment().format("DD MMM, YYYY")
  });

  const [itemId, setItemId] = useState(null);

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/reports/sale/itemtrends", 'title' : "Reports-Sale-ItemTrends" });
  }, []);

  const [records, setRecords] = useState([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);

  const [stats, setStats] = useState(defaultStats);

  useEffect(() => {
    setRecords([]);
    setRecordsLoaded(false);
    setStats(defaultStats);
  }, [dateRange, itemId])

 const loadRecords = useCallback(() => {
   if(!itemId) return setRecordsLoaded(true);
    dispatch( showProgressBar() );
    axios.post('/api/reports/sale/itemtrends', { storeId, itemId, dateRange} ).then( ({ data }) => {
      dispatch( hideProgressBar() );
      setRecords(data.map(record => ({
        ...record,
        time: moment(record.time).format('DD MMM')
      })));
      setStats({
        totalQuantity: data.reduce((total, record) => total + record.totalQuantity, 0),
        totalSale: data.reduce((total, record) => total + record.totalSaleAmount, 0),
        totalProfit: data.reduce((total, record) => total + record.totalProfit, 0),
      });
      setRecordsLoaded(true);
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch( showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }, [storeId, itemId, dispatch, dateRange]);

  useEffect(() => {
    if(records.length === 0 && !recordsLoaded)
      loadRecords();
  }, [loadRecords, records.length, recordsLoaded]);
  

  return(
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" >
        <Box width={{ xs: '100%', md: '50%' }} mr={2}>
          <SelectItem value={itemId} onChange={setItemId} />
        </Box>
        <Box width={{ xs: '100%', md: '50%' }}>
            <DateRangeFilter
            variant="outlined"
            placeholder="Select date range..."
            margin="dense"
            fullWidth={true}
            value={dateRange}
            onChange={setDateRange}
          />
        </Box>
      </Box>
      {
        records.length === 0 && recordsLoaded && !loadingRecords ?
        <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
          { itemId ? <Typography gutterBottom>No sales data found in this period</Typography> : <Typography gutterBottom>Please select an item to find it's sales trends</Typography> }
          { itemId ? <Button startIcon={ <FontAwesomeIcon icon={faSync} /> } variant="contained" onClick={() => loadRecords()} color="primary" disableElevation  >Refresh</Button> : null }
        </Box>
        :
        <Box>
         
        </Box>
      }
      {
        records.length === 0 && recordsLoaded && !loadingRecords ? null :
        <Box display="flex" justifyContent="space-between" mt={1}>
          <Typography>Total Quantity: <b>{ stats.totalQuantity.toLocaleString() }</b></Typography>
          <Typography>Total Sale: <b>{ stats.totalSale.toLocaleString() }</b></Typography>
          <Typography>Total Profit: <b>{ stats.totalProfit.toLocaleString() }</b></Typography>
        </Box>
      }
      {
        records.length === 0 && recordsLoaded && !loadingRecords ? null :
        <Box height="400px" mt={4}>
          <ResponsiveContainer width="100%" height="100%" style={{ backgroundColor: "#fff" }}>
            <LineChart
              width={500}
              height={300}
              data={records}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalSaleAmount" name="Sale" stroke="#8884d8" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="totalProfit" name="Profit" stroke="#2196f3" />
              <Line type="monotone" dataKey="totalQuantity" name="Quantity" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      }
      </>
  )
}


const mapStateToProps = state => {
  return {
    storeId: state.stores.selectedStoreId,
    loadingRecords: state.progressBar.loading
  }
}


export default connect(mapStateToProps)(ItemTrends);