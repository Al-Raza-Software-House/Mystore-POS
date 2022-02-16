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
import { accountHeadTypes } from 'utils/constants';

const defaultStats = {
    totalTxns: 0,
    totalAmount: 0
}

const formName = "expensesFilters";

function Expenses({ storeId, heads, loadingRecords, dispatch }) {
  const filters = useSelector(state => getFormValues(formName)(state));
  useEffect(() => {
    dispatch(initialize(formName, { dateRange: moment().subtract(365, 'days').format("DD MMM, YYYY") + " - " + moment().format("DD MMM, YYYY"), headId: 0, }))
  }, [dispatch])  

  const headOptions = useMemo(() => {
    let options = heads.map(head => ({ id: head._id, title: head.name }) );
    return [{ id: 0, title: "Select Expense Head" }, ...options]
  }, [heads]);

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/reports/accounts/expenses", 'title' : "Reports-Accounts-Expenses" });
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
    if(filters.headId) payload.headId = filters.headId;
    axios.post('/api/reports/accounts/expenses',  payload).then( ({ data }) => {
      dispatch( hideProgressBar() );
      setRecords(data.map(record => ({
        totalAmount: Math.round(Math.abs(record.totalAmount)),
        month: moment(record.month).format('MMM')
      })));
      setStats({
        totalTxns: data.reduce((total, record) => total + record.totalTxns, 0),
        totalAmount: Math.round(data.reduce((total, record) => total + Math.abs(record.totalAmount), 0)),
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
    <Box px={3}>
      <ExpenseFilters heads={headOptions} />
      {
        records.length === 0 && recordsLoaded && !loadingRecords ?
        <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
          { filters && (filters.dateRange || filters.headId) ? <Typography gutterBottom>No data found in this period</Typography> : <Typography gutterBottom>No data found</Typography> }
          { filters && (filters.dateRange || filters.headId) ? <Button startIcon={ <FontAwesomeIcon icon={faSync} /> } variant="contained" onClick={() => loadRecords()} color="primary" disableElevation  >Refresh</Button> : null }
        </Box>
        :
        <Box>
         
        </Box>
      }
      {
        records.length === 0 && recordsLoaded && !loadingRecords ? null :
        <Box display="flex" justifyContent="space-between" mt={1}>
          <Typography>Total Transactions: <b>{ stats.totalTxns.toLocaleString() }</b></Typography>
          <Typography>Total Amount: <b>{ Math.abs(stats.totalAmount).toLocaleString() }</b></Typography>
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
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalAmount" name="Sale" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      }
      </Box>
  )
}



const Filters = React.memo(
  ({ heads }) => {

    return(
      <Box display="flex" justifyContent="space-between" alignItems="center" >
        <Box width={{ xs: '100%', md: '45%' }} >
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
        <Box width={{ xs: '100%', md: '45%' }}>
          <Field
            component={SelectInput}
            options={heads}
            name="headId"
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

const ExpenseFilters = reduxForm({
    'form': formName,
})(Filters);

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  const heads = state.accounts.heads[storeId] ? state.accounts.heads[storeId] : [];

  return {
    storeId,
    heads: heads.filter(head => head.type === accountHeadTypes.ACCOUNT_HEAD_TYPE_EXPENSE),
    loadingRecords: state.progressBar.loading
  }
}



export default connect(mapStateToProps)(Expenses);