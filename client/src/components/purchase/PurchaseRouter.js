import React from 'react';
import { makeStyles, Paper, Box } from '@material-ui/core';
import StyledTabs from '../library/StyledTabs';
import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';


const useStyles = makeStyles(theme => ({
  paper:{
    width: 'inherit',
  }
}))

const menues = [
  {to: '/purchase', title: 'Purchase Orders'},
  {to: '/purchase/grns', title: 'GRN'},
  {to: '/purchase/returns', title: 'Return to Vendor'}
]

function PurchaseRouter({ loadVideos }){
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
            
          </Switch>
        </Box>
      </Paper>
    </Box>
  )
}

export default connect(null, null)(PurchaseRouter);