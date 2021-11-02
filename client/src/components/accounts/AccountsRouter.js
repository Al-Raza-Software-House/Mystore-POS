import React from 'react';
import { makeStyles, Paper, Box } from '@material-ui/core';
import StyledTabs from '../library/StyledTabs';
import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import AccountTransactions from './transactions/AccountTransactions';
import CreateBank from './banks/CreateBank';
import EditBank from './banks/EditBank';
import Banks from './banks/Banks';
import CreateHead from './accountHeads/CreateHead';
import EditHead from './accountHeads/EditHead';
import Heads from './accountHeads/Heads';


const useStyles = makeStyles(theme => ({
  paper:{
    width: 'inherit',
  }
}))

const menues = [
  {to: '/accounts', title: 'Transactions'},
  {to: '/accounts/heads', title: 'Account Heads'},
  {to: '/accounts/banks', title: 'Banks'},
]

function AccountsRouter({ loadVideos }){
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
        <Box px={3} pt={2} >
          <Switch>
            
            <Route path="/accounts/banks/create" component={CreateBank} />
            <Route path="/accounts/banks/edit/:storeId/:bankId" component={EditBank} />
            <Route path="/accounts/banks" component={Banks} />

            <Route path="/accounts/heads/create" component={CreateHead} />
            <Route path="/accounts/heads/edit/:storeId/:headId" component={EditHead} />
            <Route path="/accounts/heads" component={Heads} />

            <Route path="/accounts" component={AccountTransactions} />
          </Switch>
        </Box>
      </Paper>
    </Box>
  )
}

export default connect(null, null)(AccountsRouter);