import React, { useState } from 'react';
import { makeStyles, Paper, Box } from '@material-ui/core';
import StyledTabs from '../library/StyledTabs';
import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import SaleAndReturn from './pos/SaleAndReturn';
import Sales from './Sales';
import PrintSale from './PrintSale';
import Closings from './Closings';
import ViewClosing from './ViewClosing';
import PrintClosing from './PrintClosing';

const useStyles = makeStyles(theme => ({
  paper:{
    width: 'inherit',
  }
}))

const menues = [
  {to: '/sale', title: 'Sale & Return'},
  {to: '/sale/list', title: 'History'},
  {to: '/sale/closings', title: 'End of Day'}
]

function SaleRouter(){
  const classes = useStyles();
  const [printSale, setPrintSale] = useState(null);
  const [printClosing, setPrintClosing] = useState(null);

  return(
    <Box display="flex" flexDirection="column" justifyContent="space-between" height="100%">
      <PrintSale sale={printSale} setSale={setPrintSale} />
      <PrintClosing closing={printClosing} setClosing={setPrintClosing} />
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

            <Route path="/sale/closings/view/:storeId/:closingId" render={props => <ViewClosing {...props} printClosing={setPrintClosing} />} />
            <Route path="/sale/closings" render={props => <Closings {...props} printClosing={setPrintClosing} />} />

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