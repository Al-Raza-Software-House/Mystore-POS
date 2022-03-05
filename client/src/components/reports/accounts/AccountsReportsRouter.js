import React, { useMemo } from 'react';
import { makeStyles, Paper, Box } from '@material-ui/core';
import StyledTabs from '../../library/StyledTabs';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';
import { isManager } from 'utils';
import { useSelector } from 'react-redux';
import PayableReceivable from './PayableReceivable';
import Expenses from './Expenses';
import IncomeStatement from './IncomeStatement';


const useStyles = makeStyles(theme => ({
  paper:{
    width: 'inherit',
  }
}))

const menues = [
  {to: '/reports/accounts', title: 'Income Statement'},
  {to: '/reports/accounts/payablereceivable', title: 'Payable & Receivable'},
  {to: '/reports/accounts/expenses', title: 'Expenses'}
]

const managersMenues = [
  {to: '/reports/accounts/payablereceivable', title: 'Payable & Receivable'},
  {to: '/reports/accounts/expenses', title: 'Expenses'}
]

function AccountsReportsRouter(){
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
    return <Redirect to="/reports/accounts/payablereceivable" />

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
        <Box px={0} pt={0} >
          <Switch>
             <Route path="/reports/accounts/expenses" component={Expenses} />
             <Route path="/reports/accounts/payablereceivable" component={PayableReceivable} />
             <Route path="/reports/accounts" component={IncomeStatement} />
          </Switch>
        </Box>
      </Paper>
    </Box>
  )
}

export default AccountsReportsRouter;