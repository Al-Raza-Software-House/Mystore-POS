import React, { useState } from 'react';
import { makeStyles, Paper, Box } from '@material-ui/core';
import StyledTabs from '../library/StyledTabs';
import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import SaleAndReturn from './SaleAndReturn';
import Sales from './Sales';
import EndOfDay from './EndOfDay';
import EndOfDayList from './EndOfDayList';

const useStyles = makeStyles(theme => ({
  paper:{
    width: 'inherit',
  }
}))

const menues = [
  {to: '/sale', title: 'Sale & Return'},
  {to: '/sale/list', title: 'History'},
  {to: '/sale/endofday', title: 'End of Day'}
]

function SaleRouter(){
  const classes = useStyles();
  const [printSale, setPrintSale] = useState(null);
  const [printGRN, setPrintGRN] = useState(null);
  const [printRTV, setPrintRTV] = useState(null);

  return(
    <Box display="flex" flexDirection="column" justifyContent="space-between" height="100%">
      {/* <PrintPurchaseOrder order={printSale} setOrder={setPrintSale} />
      <PrintGRN grn={printGRN} setGrn={setPrintGRN} />
      <PrintRtv rtv={printRTV} setRtv={setPrintRTV} /> */}
      <Paper className={classes.paper} square>
        <Box>
          <Box px={3} pt={0}>
            <StyledTabs menues={menues} />
          </Box>
        </Box>
      </Paper>
      <Paper className={classes.paper} style={{flexGrow: 1}} variant="outlined" square>
        <Box px={3} pt={2} >
          <Switch>

            <Route path="/sale/endofday/view/:storeId/:eodId" render={props => <EndOfDay {...props} printSale={setPrintSale} />} />
            <Route path="/sale/endofday" render={props => <EndOfDayList {...props} printSale={setPrintSale} />} />

            <Route path="/sale/view/:storeId/:saleId" render={props => <SaleAndReturn {...props} printSale={setPrintSale} />} />
            <Route path="/sale/list" render={props => <Sales {...props} printSale={setPrintSale} />} />
            <Route path="/sale" render={props => <SaleAndReturn {...props} printSale={setPrintSale} />} />

          </Switch>
        </Box>
      </Paper>
    </Box>
  )
}

export default connect(null, null)(SaleRouter);