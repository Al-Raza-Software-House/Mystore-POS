import React from 'react';
import { makeStyles, Paper, Box, Typography } from '@material-ui/core';
import StyledTabs from '../library/StyledTabs';
import { Route, Switch } from 'react-router-dom';
import BillingHistory from './BillingHistory';
import CurrentBill from './CurrentBill';

const useStyles = makeStyles(theme => ({
  paper:{
    width: 'inherit',
  }
}))

const menues = [
  {to: '/billing', title: 'Current Bill'},
  {to: '/billing/history', title: 'History'},
]

function BillingRouter(){
  const classes = useStyles();

  return(
    <Box display="flex" flexDirection="column" justifyContent="space-between" height="100%">
      <Paper className={classes.paper} square>
        <Box>
          <Box pl={4} py={3}>
            <Typography style={{ fontSize: '25px', fontWeight: '500', 'lineHeight': '32px' }} >Billing</Typography>
          </Box>
          <Box px={3}>
            <StyledTabs menues={menues} />
          </Box>
        </Box>
      </Paper>
      <Paper className={classes.paper} style={{flexGrow: 1}} variant="outlined" square>
        <Box p={3} >
          <Switch>
            <Route path="/billing/history" component={BillingHistory} />
            <Route path="/billing" component={CurrentBill} />
          </Switch>
        </Box>
      </Paper>
    </Box>
  )
}

export default BillingRouter;