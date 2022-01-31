import React from 'react';
import { makeStyles, Paper, Box, Typography } from '@material-ui/core';
import StyledTabs from '../library/StyledTabs';
import { Switch, Route } from 'react-router-dom';
import General from './General';
import Configuration from './Configuration';
import Users from './Users';
import Receipt from './Receipt';
import AddUser from './AddUser';
import SystemSettings from './SystemSettings';
const useStyles = makeStyles(theme => ({
  paper:{
    width: 'inherit',
  }
}))

const menues = [
  {to: '/store-settings', title: 'General'},
  {to: '/store-settings/configuration', title: 'Configuration'},
  {to: '/store-settings/receipt', title: 'Receipt'},
  {to: '/store-settings/users', title: 'Users'},
  {to: '/store-settings/system', title: 'System'},
]

function StoreSettingsRouter(props){
  const classes = useStyles();
  return(
    <Box display="flex" flexDirection="column" justifyContent="space-between" height="100%">
      <Paper className={classes.paper} square>
        <Box>
          <Box pl={4} py={3}>
            <Typography style={{ fontSize: '25px', fontWeight: '500', 'lineHeight': '32px' }} >Store Settings</Typography>
          </Box>
          <Box px={3}>
            <StyledTabs menues={menues} />
          </Box>
        </Box>
      </Paper>
      <Paper className={classes.paper} style={{flexGrow: 1}} variant="outlined" square>
        <Box p={3} >
          <Switch>
            <Route path="/store-settings/users/adduser" component={AddUser} />
            <Route path="/store-settings/users" component={Users} />
            <Route path="/store-settings/receipt" component={Receipt} />
            <Route path="/store-settings/configuration" component={Configuration} />
            <Route path="/store-settings/system" component={SystemSettings} />
            <Route path="/store-settings/" component={General} />
          </Switch>
        </Box>
      </Paper>
    </Box>
  )
}

export default StoreSettingsRouter;