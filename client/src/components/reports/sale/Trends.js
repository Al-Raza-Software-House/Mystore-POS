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
import SelectItemInput from 'components/library/SelectItemInput';
import { Field, getFormValues, initialize, reduxForm } from 'redux-form';
import SelectCategory from 'components/stock/items/itemForm/SelectCategory';
import SelectSupplier from 'components/stock/items/itemForm/SelectSupplier';
import { isManager } from 'utils';

const defaultStats = {
    totalQuantity: 0,
    totalSale: 0,
    totalProfit: 0
  }
const formName = "saleTrendsFilters";

function Trends({ storeId, loadingRecords, dispatch, userRole }) {
  const filters = useSelector(state => getFormValues(formName)(state));
  useEffect(() => {
    dispatch(initialize(formName, { dateRange: moment().subtract(30, 'days').format("DD MMM, YYYY") + " - " + moment().format("DD MMM, YYYY"), itemId: null, categoryId: null, supplierId: null }))
  }, [dispatch])  


  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/reports/sale/trends", 'title' : "Reports-Sale-Trends" });
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
   if(!filters || (!filters.itemId && !filters.categoryId && !filters.supplierId)) return setRecordsLoaded(true);
    dispatch( showProgressBar() );
    const payload = { storeId, dateRange: filters.dateRange};
    if(filters.itemId) payload.itemId = filters.itemId;
    else
    {
      if(filters.categoryId) payload.categoryId = filters.categoryId;
      if(filters.supplierId) payload.supplierId = filters.supplierId;
    }
    axios.post('/api/reports/sale/itemtrends',  payload).then( ({ data }) => {
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
  }, [storeId, dispatch, filters]);

  useEffect(() => {
    if(records.length === 0 && !recordsLoaded)
      loadRecords();
  }, [loadRecords, records.length, recordsLoaded]);
  

  return(
    <>
      <TrendsFilters />
      {
        records.length === 0 && recordsLoaded && !loadingRecords ?
        <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
          { filters && (filters.itemId || filters.categoryId || filters.supplierId) ? <Typography gutterBottom>No sales data found in this period</Typography> : <Typography gutterBottom>Please select an item/category/supplier to find it's sales trends</Typography> }
          { filters && (filters.itemId || filters.categoryId || filters.supplierId) ? <Button startIcon={ <FontAwesomeIcon icon={faSync} /> } variant="contained" onClick={() => loadRecords()} color="primary" disableElevation  >Refresh</Button> : null }
        </Box>
        :
        <Box>
         
        </Box>
      }
      {
        records.length === 0 && recordsLoaded && !loadingRecords ? null :
        <Box display="flex" justifyContent="space-between" mt={1}>
          <Typography>Total Quantity: <b>{ stats.totalQuantity.toLocaleString() }</b></Typography>
          {
            isManager(userRole) ? null : 
            <>
              <Typography>Total Sale: <b>{ stats.totalSale.toLocaleString() }</b></Typography>
              <Typography>Total Profit: <b>{ stats.totalProfit.toLocaleString() }</b></Typography> 
            </>
          }
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
              {
                isManager(userRole) ? null : 
                <>
                  <Line type="monotone" dataKey="totalSaleAmount" name="Sale" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="totalProfit" name="Profit" stroke="#2196f3" />
                </>
              }
              <Line type="monotone" dataKey="totalQuantity" name="Quantity" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      }
      </>
  )
}



const Filters = React.memo(
  () => {
    const values = useSelector(state => getFormValues(formName)(state));

    return(
      <Box display="flex" justifyContent="space-between" alignItems="center" >
        <Box width={{ xs: '100%', md: '24%' }} >
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
        <Box width={{ xs: '100%', md: '29%' }}>
          {
            values && (values.categoryId || values.supplierId) ? null :
            <Field
              component={SelectItemInput}
              label="Select Item"
              name="itemId"
              fullWidth={true}
              variant="outlined"
              margin="dense"
            />
          }
        </Box>
        <Box width={{ xs: '100%', md: '19%' }} >
          {
            values && values.itemId ? null :
            <SelectCategory formName={formName} addNewRecord={false} showError={false}/>
          }
        </Box>
        <Box width={{ xs: '100%', md: '24%' }} >
          {
            values && values.itemId ? null :
            <SelectSupplier formName={formName} addNewRecord={false} showError={false}/>
          }
        </Box>
      </Box>
    )
  }
)

const TrendsFilters = reduxForm({
    'form': formName,
})(Filters);

const mapStateToProps = state => {
  return {
    storeId: state.stores.selectedStoreId,
    loadingRecords: state.progressBar.loading,
    userRole: state.stores.userRole,
  }
}



export default connect(mapStateToProps)(Trends);