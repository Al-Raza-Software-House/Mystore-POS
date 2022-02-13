import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import { Box, Button, Typography } from '@material-ui/core';
import { connect, useSelector } from 'react-redux';
import moment from 'moment';
import axios from 'axios';
import { hideProgressBar, showProgressBar } from '../../../store/actions/progressActions';
import { showError } from '../../../store/actions/alertActions';
import ReactGA from "react-ga4";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DateRangeInput from 'components/library/form/DateRangeInput';
import { Field, getFormValues, initialize, reduxForm } from 'redux-form';
import SelectInput from 'components/library/form/SelectInput';
import SelectCustomer from 'components/sale/pos/SelectCustomer';

const defaultStats = {
    totalReceipts: 0,
    totalSale: 0,
    totalProfit: 0
  }
const formName = "saleHistoryFilters";

function SaleHistory({ storeId, users, loadingRecords, dispatch }) {
  const filters = useSelector(state => getFormValues(formName)(state));
  useEffect(() => {
    dispatch(initialize(formName, { dateRange: moment().subtract(30, 'days').format("DD MMM, YYYY") + " - " + moment().format("DD MMM, YYYY"), userId: 0, customerId: null }))
  }, [dispatch])  

  const userOptions = useMemo(() => {
    let options = users.map(user => ({ id: user._id, title: user.name }) );
    return [{ id: 0, title: "Select user" }, ...options]
  }, [users]);

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/reports/sale/history", 'title' : "Reports-Sale-History" });
  }, []);

  const [records, setRecords] = useState([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);

  const [stats, setStats] = useState(defaultStats);

  useEffect(() => {
    setRecords([]);
    setRecordsLoaded(false);
    setStats(defaultStats);
  }, [filters])

 const loadRecords = useCallback(() => {
   if(!filters) return;
    dispatch( showProgressBar() );
    const payload = { storeId,  dateRange: filters.dateRange };
    if(filters.userId) payload.userId = filters.userId;
    if(filters.customerId) payload.customerId = filters.customerId;
    axios.post('/api/reports/sale/history',  payload).then( ({ data }) => {
      dispatch( hideProgressBar() );
      setRecords(data.map(record => ({
        ...record,
        totalSaleAmount: Math.round(record.totalSaleAmount),
        totalGrossProfit: Math.round(record.totalGrossProfit),
        saleDate: moment(record.saleDate).format('DD MMM')
      })));
      setStats({
        totalReceipts: data.reduce((total, record) => total + record.totalReceipts, 0),
        totalSale: Math.round(data.reduce((total, record) => total + record.totalSaleAmount, 0)),
        totalProfit: Math.round(data.reduce((total, record) => total + record.totalGrossProfit, 0)),
      });
      setRecordsLoaded(true);
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch( showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }, [storeId, dispatch, filters]);

  useEffect(() => {
    if(records.length === 0 && !recordsLoaded)
      loadRecords();
  }, [loadRecords, records.length, recordsLoaded]);
  

  return(
    <>
      <HistoryFilters users={userOptions} />
      {
        records.length === 0 && recordsLoaded && !loadingRecords ?
        <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
          { filters && (filters.dateRange || filters.userId || filters.customerId) ? <Typography gutterBottom>No sales data found in this period</Typography> : <Typography gutterBottom>No data found</Typography> }
          { filters && (filters.dateRange || filters.userId || filters.customerId) ? <Button startIcon={ <FontAwesomeIcon icon={faSync} /> } variant="contained" onClick={() => loadRecords()} color="primary" disableElevation  >Refresh</Button> : null }
        </Box>
        :
        <Box>
         
        </Box>
      }
      {
        records.length === 0 && recordsLoaded && !loadingRecords ? null :
        <Box display="flex" justifyContent="space-between" mt={1}>
          <Typography>Total Receipts: <b>{ stats.totalReceipts.toLocaleString() }</b></Typography>
          <Typography>Total Sale Amount: <b>{ stats.totalSale.toLocaleString() }</b></Typography>
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
              <XAxis dataKey="saleDate" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalSaleAmount" name="Sale" stroke="#8884d8" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="totalGrossProfit" name="Gross Profit" stroke="#2196f3" />
              <Line type="monotone" dataKey="totalReceipts" name="Receipts" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      }
      </>
  )
}



const Filters = React.memo(
  ({ users }) => {

    return(
      <Box display="flex" justifyContent="space-between" alignItems="center" >
        <Box width={{ xs: '100%', md: '30%' }} >
          <Field
            component={DateRangeInput}
            label="Date Range"
            name="dateRange"
            placeholder="Select Date Range..."
            fullWidth={true}
            variant="outlined"
            margin="dense"
            showError={false}
          />
        </Box>
        <Box width={{ xs: '100%', md: '30%' }}>
          <Field
            component={SelectCustomer}
            formName={formName}
            name="customerId"
            addNewRecord={false}
          />
        </Box>
        <Box width={{ xs: '100%', md: '30%' }}>
          <Field
            component={SelectInput}
            options={users}
            name="userId"
            fullWidth={true}
            variant="outlined"
            margin="dense"
            showError={false}
          />
        </Box>
      </Box>
    )
  }
)

const HistoryFilters = reduxForm({
    'form': formName,
})(Filters);

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  const store = state.stores.stores.find(store => store._id === storeId);
  return {
    storeId,
    users: store.users.map(user => user.record),
    loadingRecords: state.progressBar.loading
  }
}



export default connect(mapStateToProps)(SaleHistory);