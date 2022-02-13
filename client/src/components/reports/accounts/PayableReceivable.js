import React, { useMemo, useState, useEffect } from 'react';
import { Box, Typography, ListItem, List, makeStyles } from '@material-ui/core';
import { connect } from 'react-redux';
import ReactGA from "react-ga4";

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

function PayableReceivable({ customers, suppliers }) {
  const classes = useStyles();
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/reports/accounts/payablereceivable", 'title' : "Reports-Payable-Receivable" });
  }, []);

  const topSuppliers = useMemo(() => {
    let records = suppliers.filter(record => record.currentBalance !== 0);
    return records.sort(function(a, b){
      if(a.currentBalance > b.currentBalance) return -1;
      if(a.currentBalance < b.currentBalance) return 1;
      return 0;
    });
  }, [suppliers])
  const totalPayable = useMemo(() => Math.round(suppliers.reduce((total, record) => total + record.currentBalance, 0)) , [suppliers]);

  const topCustomers = useMemo(() => {
    let records = customers.filter(record => record.currentBalance !== 0);
    return records.sort(function(a, b){
      if(a.currentBalance > b.currentBalance) return -1;
      if(a.currentBalance < b.currentBalance) return 1;
      return 0;
    });
  }, [customers])

  const totalReceivable = useMemo(() => Math.round(customers.reduce((total, record) => total + record.currentBalance, 0)) , [customers]);

  
  return(
    <Box style={{ minHeight: 'calc(100vh - 164px)' , backgroundColor: "#f9f9f9"}} px={3}>
      {
        customers.length === 0 && suppliers.length === 0 ?
        <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
          <Typography gutterBottom>No data found</Typography>
        </Box>
        :
        <Box display="flex" justifyContent="space-between" pt={5}>
          <Box width={{ xs: "100%", md: "48%" }}>
            <List className={classes.list}>
              <ListItem>
                <Typography style={{ fontSize: '22px', display: "flex", justifyContent: "space-between", width: '100%' }}>
                  <span>Total Payable</span>
                  <b style={{ color: "#2196f3" }}>{ totalPayable.toLocaleString() }</b>
                </Typography>
              </ListItem>
              {
                topSuppliers.map(record => (
                  <ListItem key={record._id} className={classes.listItem}>
                    <Typography style={{ fontSize: '16px', display: "flex", justifyContent: "space-between", width: '100%' }}>
                      <span>{ record.name }</span>
                      <span style={{ color: "#7c7c7c" }}>{ record.mobile }</span>
                      <b >{ record.currentBalance.toLocaleString() }</b>
                    </Typography>
                  </ListItem>
                ))
              }
            </List>
          </Box>

          <Box width={{ xs: "100%", md: "48%" }}>
            <List className={classes.list}>
              <ListItem>
                <Typography style={{ fontSize: '22px', display: "flex", justifyContent: "space-between", width: '100%' }}>
                  <span>Total Receivable</span>
                  <b style={{ color: "#2196f3" }}>{ totalReceivable.toLocaleString() }</b>
                </Typography>
              </ListItem>
              {
                topCustomers.map(record => (
                  <ListItem key={record._id} className={classes.listItem}>
                    <Typography style={{ fontSize: '16px', display: "flex", justifyContent: "space-between", width: '100%' }}>
                      <span>{ record.name }</span>
                      <span style={{ color: "#7c7c7c" }}>{ record.mobile }</span>
                      <b >{ record.currentBalance.toLocaleString() }</b>
                    </Typography>
                  </ListItem>
                ))
              }
            </List>
          </Box>

        </Box>
      }
    </Box>
  )
}


const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  return {
    storeId,
    customers: state.customers[storeId] ? state.customers[storeId] : [],
    suppliers: state.suppliers[storeId] ? state.suppliers[storeId] : [],
  }
}


export default connect(mapStateToProps)(PayableReceivable);