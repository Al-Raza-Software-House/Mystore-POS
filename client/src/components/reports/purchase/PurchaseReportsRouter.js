import React from 'react';
import { makeStyles, Paper, Box } from '@material-ui/core';
import StyledTabs from '../../library/StyledTabs';
import { Route, Switch } from 'react-router-dom';
import PurchaseHistory from './PurchaseHistory';
import TopSuppliers from './TopSuppliers';


const useStyles = makeStyles(theme => ({
  paper:{
    width: 'inherit',
  }
}))

const menues = [
  {to: '/reports/purchase', title: 'History'},
  {to: '/reports/purchase/topsuppliers', title: 'Top Suppliers'},
]

function PurchaseReportsRouter(){
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
      <Paper style={{flexGrow: 1}} variant="outlined" square>
        <Box px={3} pt={0} >
          <Switch>
             <Route path="/reports/purchase/topsuppliers" component={TopSuppliers} />
             <Route path="/reports/purchase" component={PurchaseHistory} />
          </Switch>
        </Box>
      </Paper>
    </Box>
  )
}

export default PurchaseReportsRouter;