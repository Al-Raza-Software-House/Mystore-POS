import React from 'react';
import { makeStyles, Paper, Box } from '@material-ui/core';
import StyledTabs from '../library/StyledTabs';
import { Route, Switch } from 'react-router-dom';
import StockReportsRouter from './stock/StockReportsRouter';
import SaleReportsRouter from './sale/SaleReportsRouter';
import PurchaseReportsRouter from './purchase/PurchaseReportsRouter';
import AccountsReportsRouter from './accounts/AccountsReportsRouter';


const useStyles = makeStyles(theme => ({
  paper:{
    width: 'inherit',
  }
}))

const menues = [
  {to: '/reports', title: 'Stock'},
  {to: '/reports/sale', title: 'Sale'},
  {to: '/reports/purchase', title: 'Purchase'},
  {to: '/reports/accounts', title: 'Accounts'},
]

function ReportsRouter(){
  const classes = useStyles();

  return(
    <Box display="flex" flexDirection="column" justifyContent="space-between" height="100%">
      <Paper className={classes.paper} square>
        <Box>
          <Box px={3} pt={0}>
            <StyledTabs menues={menues} />
          </Box>
        </Box>
      </Paper>
      <Paper className={classes.paper} style={{flexGrow: 1}} variant="outlined" square>
        <Box height="100%">
          <Switch>
            <Route path="/reports/accounts" component={AccountsReportsRouter} />
            <Route path="/reports/purchase" component={PurchaseReportsRouter} />
            <Route path="/reports/sale" component={SaleReportsRouter} />
            <Route path="/reports" component={StockReportsRouter} />
          </Switch>
        </Box>
      </Paper>
    </Box>
  )
}

export default ReportsRouter;