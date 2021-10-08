import React, { useEffect } from 'react';
import { makeStyles, Paper, Box, Typography } from '@material-ui/core';
import StyledTabs from '../library/StyledTabs';
import { Route, Switch } from 'react-router-dom';
import VideosList from './VideosList';
import { connect } from 'react-redux';
import { loadVideos } from '../../store/actions/helpActions';
import ContactUs from './ContactUs';

const useStyles = makeStyles(theme => ({
  paper:{
    width: 'inherit',
  }
}))

const menues = [
  {to: '/help', title: 'General'},
  {to: '/help/stock', title: 'Stock'},
  {to: '/help/sale', title: 'Sale'},
  {to: '/help/purchase', title: 'Purchase'},
  {to: '/help/parties', title: 'Parties'},
  {to: '/help/accounts', title: 'Accounts'},
  {to: '/help/reports', title: 'Reports'},
  {to: '/help/settings', title: 'Settings'},
  {to: '/help/billing', title: 'Billing'},
  {to: '/help/stores', title: 'Stores'},
  {to: '/help/contactus', title: 'Contact Us'},
]

function HelpRouter({ loadVideos }){
  const classes = useStyles();
  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  return(
    <Box display="flex" flexDirection="column" justifyContent="space-between" height="100%">
      <Paper className={classes.paper} square>
        <Box>
          <Box pl={4} py={3}>
            <Typography style={{ fontSize: '25px', fontWeight: '500', 'lineHeight': '32px' }} >Help</Typography>
          </Box>
          <Box px={3}>
            <StyledTabs menues={menues} minWidth={80} />
          </Box>
        </Box>
      </Paper>
      <Paper className={classes.paper} style={{flexGrow: 1}} variant="outlined" square>
        <Box p={3} >
          <Switch>
            <Route path="/help/contactus" component={ContactUs} />
            <Route path="/help" component={VideosList} />
          </Switch>
        </Box>
      </Paper>
    </Box>
  )
}

export default connect(null, { loadVideos })(HelpRouter);