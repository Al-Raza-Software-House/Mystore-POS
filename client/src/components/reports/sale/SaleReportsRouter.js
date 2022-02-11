import React, { useMemo } from 'react';
import { makeStyles, Paper, Box } from '@material-ui/core';
import StyledTabs from '../../library/StyledTabs';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';
import { isManager } from 'utils';
import { useSelector } from 'react-redux';
import ItemTrends from './ItemTrends';


const useStyles = makeStyles(theme => ({
  paper:{
    width: 'inherit',
  }
}))

const menues = [
  {to: '/reports/sale', title: 'Item Trends'},
  {to: '/reports/sale/history', title: 'History'},
  {to: '/reports/sale/topselling', title: 'Top Selling'},
  {to: '/reports/sale/lowselling', title: 'Low Selling'},
  {to: '/reports/sale/topprofitable', title: 'Top Profitable'},
  {to: '/reports/sale/lowprofitable', title: 'Low Profitable'},
  {to: '/reports/sale/zerosales', title: 'Zero Sales'},
]

const managersMenues = [
  {to: '/reports/sale', title: 'Item Trends'},
  {to: '/reports/sale/topselling', title: 'Top Selling'},
  {to: '/reports/sale/lowselling', title: 'Low Selling'},
  {to: '/reports/sale/zerosales', title: 'Zero Sales'},
]

function SaleReportsRouter(){
  const classes = useStyles();
  const userRole = useSelector(state => state.stores.userRole);
  const { pathname } = useLocation();

  const subMenues = useMemo(() => {
    let tabs = menues;
    if(isManager(userRole))
      tabs = managersMenues;
    return tabs;
  }, [userRole]);

  if(isManager(userRole) && !managersMenues.find(record => pathname === record.to ) )
    return <Redirect to="/reports" />

  return(
    <Box display="flex" flexDirection="column" justifyContent="space-between" height="100%">
      <Paper className={classes.paper} square>
        <Box>
          <Box px={3} pt={0}>
            <StyledTabs menues={subMenues} />
          </Box>
        </Box>
      </Paper>
      <Paper style={{flexGrow: 1}} variant="outlined" square>
        <Box px={3} pt={0} >
          <Switch>
             <Route path="/reports/sale/history" component={ItemTrends} /> 
             <Route path="/reports/sale/topselling" component={ItemTrends} />
             <Route path="/reports/sale/lowselling" component={ItemTrends} />
             <Route path="/reports/sale/topprofitable" component={ItemTrends} />
             <Route path="/reports/sale/lowprofitable" component={ItemTrends} />
             <Route path="/reports/sale/zerosales" component={ItemTrends} />
             <Route path="/reports/sale" component={ItemTrends} />
          </Switch>
        </Box>
      </Paper>
    </Box>
  )
}

export default SaleReportsRouter;