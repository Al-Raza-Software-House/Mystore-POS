import React, { useCallback, useEffect, useState } from 'react';
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
import SelectSupplier from 'components/stock/items/itemForm/SelectSupplier';

const defaultStats = {
    totalGrns: 0,
    totalAmount: 0
  }
const formName = "purchaseHistoryFilters";

function PurchaseHistory({ storeId, loadingRecords, dispatch }) {
  const filters = useSelector(state => getFormValues(formName)(state));
  useEffect(() => {
    dispatch(initialize(formName, { dateRange: moment().subtract(30, 'days').format("DD MMM, YYYY") + " - " + moment().format("DD MMM, YYYY"), supplierId: null }))
  }, [dispatch])  

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/reports/purchase", 'title' : "Reports-Purchase-History" });
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
    if(filters.supplierId) payload.supplierId = filters.supplierId;
    axios.post('/api/reports/purchase/history',  payload).then( ({ data }) => {
      dispatch( hideProgressBar() );
      setRecords(data.map(record => ({
        ...record,
        totalAmount: Math.round(record.totalAmount),
        grnDate: moment(record.grnDate).format('DD MMM')
      })));
      setStats({
        totalGrns: data.reduce((total, record) => total + record.totalGrns, 0),
        totalAmount: Math.round(data.reduce((total, record) => total + record.totalAmount, 0))
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
      <HistoryFilters />
      {
        records.length === 0 && recordsLoaded && !loadingRecords ?
        <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
          { filters && (filters.dateRange || filters.supplierId) ? <Typography gutterBottom>No purchase data found in this period</Typography> : <Typography gutterBottom>No data found</Typography> }
          { filters && (filters.dateRange || filters.supplierId) ? <Button startIcon={ <FontAwesomeIcon icon={faSync} /> } variant="contained" onClick={() => loadRecords()} color="primary" disableElevation  >Refresh</Button> : null }
        </Box>
        :
        <Box>
         
        </Box>
      }
      {
        records.length === 0 && recordsLoaded && !loadingRecords ? null :
        <Box display="flex" justifyContent="space-between" mt={1}>
          <Typography>Total Grns: <b>{ stats.totalGrns.toLocaleString() }</b></Typography>
          <Typography>Total Purchase Amount: <b>{ stats.totalAmount.toLocaleString() }</b></Typography>
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
              <XAxis dataKey="grnDate" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalAmount" name="Purchase" stroke="#8884d8" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="totalGrns" name="Grns" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      }
      </>
  )
}



const Filters = React.memo(
  () => {

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
          <SelectSupplier formName={formName} addNewRecord={false} showError={false} />
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
  return {
    storeId,
    loadingRecords: state.progressBar.loading
  }
}



export default connect(mapStateToProps)(PurchaseHistory);