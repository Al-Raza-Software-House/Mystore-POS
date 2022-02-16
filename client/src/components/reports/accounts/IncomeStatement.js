import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import { Box, Button, Typography, List, ListItem, makeStyles } from '@material-ui/core';
import { connect, useSelector } from 'react-redux';
import moment from 'moment';
import axios from 'axios';
import { hideProgressBar, showProgressBar } from '../../../store/actions/progressActions';
import { showError } from '../../../store/actions/alertActions';
import ReactGA from "react-ga4";
import DateRangeInput from 'components/library/form/DateRangeInput';
import { Field, getFormValues, initialize, reduxForm } from 'redux-form';

const useStyles = makeStyles(theme => ({
  list: {
    border: '2px solid rgba(0,0,0, 0.2)',
    borderRadius: '5px',
    backgroundColor: "#fff"
  },
  listItem:{
    borderTop: '2px solid rgba(0,0,0, 0.2)',
    textAlign: 'center',
    paddingRight: theme.spacing(2)
  }
}));

const formName = "incomeStatementFilters";

function IncomeStatement({ storeId, loadingRecords, dispatch }) {
  const classes = useStyles();
  const filters = useSelector(state => getFormValues(formName)(state));
  useEffect(() => {
    dispatch(initialize(formName, { dateRange: moment().startOf('month').format("DD MMM, YYYY") + " - " + moment().endOf("month").format("DD MMM, YYYY"), }))
  }, [dispatch])

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/reports/accounts", 'title' : "Reports-Income-Statement" });
  }, []);

  const [recordsLoaded, setRecordsLoaded] = useState(false);

  const [stats, setStats] = useState(null);

  useEffect(() => {
    setRecordsLoaded(false);
    setStats(null);
  }, [filters])

 const loadRecords = useCallback(() => {
   if(!filters) return;
    dispatch( showProgressBar() );
    const payload = { storeId,  dateRange: filters.dateRange };
    axios.post('/api/reports/accounts/incomestatement',  payload).then( ({ data }) => {
      dispatch( hideProgressBar() );
      setStats(data);
      setRecordsLoaded(true);
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch( showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }, [storeId, dispatch, filters]);

  useEffect(() => {
    if(stats === null && !recordsLoaded)
      loadRecords();
  }, [loadRecords, recordsLoaded, stats]);

  const purchaseCost = useMemo(() => {
    if(stats === null) return 0;
    let total = stats.sale.totalCost + stats.purchase.totalLoadingExpense + stats.purchase.totalFreightExpense + stats.purchase.totalOtherExpense + stats.purchase.totalPurchaseTax;
    return Math.round( total );
  }, [stats]);

  const grossIncome = useMemo(() => {
    if(stats === null) return 0;
    return Math.round( stats.sale.totalGrossProfit );
    //let grnExpenses = stats.purchase.totalLoadingExpense + stats.purchase.totalFreightExpense + stats.purchase.totalOtherExpense + stats.purchase.totalPurchaseTax;
    //return Math.round( stats.sale.totalGrossProfit - grnExpenses );
  }, [stats]);

  const netIncome = useMemo(() => {
    if(stats === null) return 0;
    let grnExpenses = stats.purchase.totalLoadingExpense + stats.purchase.totalFreightExpense + stats.purchase.totalOtherExpense + stats.purchase.totalPurchaseTax;
    return Math.round( stats.sale.totalGrossProfit - grnExpenses - Math.abs(stats.accounts.expenses) );
  }, [stats]);

  return(
    <Box px={3}>
      <IncomeStatementFilters  />
      {
        stats === null && recordsLoaded && !loadingRecords ?
        <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
          { filters && (filters.dateRange) ? <Typography gutterBottom>No data found in this period</Typography> : <Typography gutterBottom>No data found</Typography> }
          { filters && (filters.dateRange) ? <Button startIcon={ <FontAwesomeIcon icon={faSync} /> } variant="contained" onClick={() => loadRecords()} color="primary" disableElevation  >Refresh</Button> : null }
        </Box>
        :
        <Box>
         
        </Box>
      }
      {
        stats === null ? null :
        <Box display="flex" justifyContent="space-between" pt={5}>
          <Box width={{ xs: "100%", md: "32%" }}>
            <List className={classes.list}>

              <ListItem>
                <Typography style={{ fontSize: '22px', display: "flex", justifyContent: "space-between", width: '100%' }}>
                  <span>Total Sale</span>
                  <b style={{ color: "#2196f3" }}>{ Math.round(stats.sale.totalSale).toLocaleString() }</b>
                </Typography>
              </ListItem>

              <ListItem className={classes.listItem}>
                <Typography style={{ fontSize: '16px', display: "flex", justifyContent: "space-between", width: '100%' }}>
                  <span>Cash Sales</span>
                  <b >{ Math.round(stats.sale.totalCashSale).toLocaleString() }</b>
                </Typography>
              </ListItem>

              <ListItem className={classes.listItem}>
                <Typography style={{ fontSize: '16px', display: "flex", justifyContent: "space-between", width: '100%' }}>
                  <span>Bank Sales</span>
                  <b >{ Math.round(stats.sale.totalBankSale).toLocaleString() }</b>
                </Typography>
              </ListItem>

              <ListItem className={classes.listItem}>
                <Typography style={{ fontSize: '16px', display: "flex", justifyContent: "space-between", width: '100%' }}>
                  <span>Credit Sales</span>
                  <b >{ Math.round(stats.sale.totalCreditSale).toLocaleString() }</b>
                </Typography>
              </ListItem>

            </List>

            <Box mt={3}>
              <List className={classes.list}>

                <ListItem>
                  <Typography style={{ fontSize: '22px', display: "flex", justifyContent: "space-between", width: '100%' }}>
                    <span>Other Income</span>
                    <b style={{ color: "#2196f3" }}>{ Math.round(stats.accounts.income).toLocaleString() }</b>
                  </Typography>
                </ListItem>

              </List>
            </Box>
          </Box>

          <Box width={{ xs: "100%", md: "32%" }}>
            <List className={classes.list}>

              <ListItem>
                <Typography style={{ fontSize: '22px', display: "flex", justifyContent: "space-between", width: '100%' }}>
                  <span>Purchase Cost</span>
                  <b style={{ color: "#2196f3" }}>{ purchaseCost.toLocaleString() }</b>
                </Typography>
              </ListItem>

              <ListItem className={classes.listItem}>
                <Typography style={{ fontSize: '16px', display: "flex", justifyContent: "space-between", width: '100%' }}>
                  <span>Goods Cost</span>
                  <b >{ Math.round(stats.sale.totalCost).toLocaleString() }</b>
                </Typography>
              </ListItem>

              <ListItem className={classes.listItem}>
                <Typography style={{ fontSize: '16px', display: "flex", justifyContent: "space-between", width: '100%' }}>
                  <span>GRN Loading Expenses</span>
                  <b >{ Math.round(stats.purchase.totalLoadingExpense).toLocaleString() }</b>
                </Typography>
              </ListItem>

              <ListItem className={classes.listItem}>
                <Typography style={{ fontSize: '16px', display: "flex", justifyContent: "space-between", width: '100%' }}>
                  <span>GRN Freight Expenses</span>
                  <b >{ Math.round(stats.purchase.totalFreightExpense).toLocaleString() }</b>
                </Typography>
              </ListItem>

              <ListItem className={classes.listItem}>
                <Typography style={{ fontSize: '16px', display: "flex", justifyContent: "space-between", width: '100%' }}>
                  <span>Other GRN Expenses</span>
                  <b >{ Math.round(stats.purchase.totalOtherExpense).toLocaleString() }</b>
                </Typography>
              </ListItem>

              <ListItem className={classes.listItem}>
                <Typography style={{ fontSize: '16px', display: "flex", justifyContent: "space-between", width: '100%' }}>
                  <span>Purchase Tax</span>
                  <b >{ Math.round(stats.purchase.totalPurchaseTax).toLocaleString() }</b>
                </Typography>
              </ListItem>

            </List>

            <Box mt={3}>
              <List className={classes.list}>

                <ListItem>
                  <Typography style={{ fontSize: '22px', display: "flex", justifyContent: "space-between", width: '100%' }}>
                    <span>Other Expenses</span>
                    <b style={{ color: "#2196f3" }}>{ Math.round(Math.abs(stats.accounts.expenses)).toLocaleString() }</b>
                  </Typography>
                </ListItem>

              </List>
            </Box>
          </Box>

          <Box width={{ xs: "100%", md: "32%" }}>
            <List className={classes.list}>

              <ListItem>
                <Typography style={{ fontSize: '22px', display: "flex", justifyContent: "space-between", width: '100%' }}>
                  <span>Gross Income</span>
                  <b style={{ color: "#2196f3" }}>{ grossIncome.toLocaleString() }</b>
                </Typography>
              </ListItem>

              <ListItem className={classes.listItem}>
                <Typography style={{ fontSize: '22px', display: "flex", justifyContent: "space-between", width: '100%' }}>
                  <span>Net Income</span>
                  <b style={{ color: "#2196f3" }}>{ netIncome.toLocaleString() }</b>
                </Typography>
              </ListItem>

            </List>

          </Box>

        </Box>
      }
      
     
    </Box>
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
        
      </Box>
    )
  }
)

const IncomeStatementFilters = reduxForm({
    'form': formName,
})(Filters);

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;

  return {
    storeId,
    loadingRecords: state.progressBar.loading
  }
}



export default connect(mapStateToProps)(IncomeStatement);