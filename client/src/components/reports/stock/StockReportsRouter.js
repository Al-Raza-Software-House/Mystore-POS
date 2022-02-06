import React, { useMemo } from 'react';
import { makeStyles, Paper, Box } from '@material-ui/core';
import StyledTabs from '../../library/StyledTabs';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';
import StockValue from './StockValue';
import Expired from './Expired';
import Adjustments from './Adjustments';
import { isManager } from 'utils';
import { useSelector } from 'react-redux';
import Bincard from './Bincard';


const useStyles = makeStyles(theme => ({
  paper:{
    width: 'inherit',
  }
}))

const menues = [
  {to: '/reports', title: 'Adjustments'},
  {to: '/reports/stock/bincard', title: 'Bin card'},
  {to: '/reports/stock/expired', title: 'Expired'},
  {to: '/reports/stock/stockvalue', title: 'Stock Value'},
]

const managersMenues = [
  {to: '/reports', title: 'Adjustments'},
  {to: '/reports/stock/bincard', title: 'Bin card'},
  {to: '/reports/stock/expired', title: 'Expired'},
]

function StockReportsRouter(){
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
             <Route path="/reports/stock/stockvalue" component={StockValue} /> 
             <Route path="/reports/stock/expired" component={Expired} />
             <Route path="/reports/stock/bincard" component={Bincard} />
             <Route path="/reports" component={Adjustments} />
          </Switch>
        </Box>
      </Paper>
    </Box>
  )
}

export default StockReportsRouter;