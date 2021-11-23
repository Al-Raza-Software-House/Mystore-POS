import React from 'react';
import { makeStyles, Paper, Box } from '@material-ui/core';
import StyledTabs from '../library/StyledTabs';
import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import Suppliers from './suppliers/Suppliers';
import SupplierLedger from './suppliers/SupplierLedger';
import EditSupplier from './suppliers/EditSupplier';
import CreateSupplier from './suppliers/CreateSupplier';
import CreateCustomer from './customers/CreateCustomer';
import EditCustomer from './customers/EditCustomer';
import CustomerLedger from './customers/CustomerLedger';
import Customers from './customers/Customers';
import MakeSupplierPayment from './suppliers/MakeSupplierPayment';
import EditSupplierPayment from './suppliers/EditSupplierPayment';
import ReceiveCustomerPayment from './customers/ReceiveCustomerPayment';
import EditCustomerPayment from './customers/EditCustomerPayment';


const useStyles = makeStyles(theme => ({
  paper:{
    width: 'inherit',
  }
}))

const menues = [
  {to: '/parties', title: 'Suppliers'},
  {to: '/parties/customers', title: 'Customers'}
]

function PartiesRouter({ loadVideos }){
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
            <Route path="/parties/customers/receivepayment/:storeId/:customerId" component={ReceiveCustomerPayment} />
            <Route path="/parties/customers/editpayment/:customerId/:txnId" component={EditCustomerPayment} />
            <Route path="/parties/customers/new" component={CreateCustomer} />
            <Route path="/parties/customers/edit/:storeId/:customerId" component={EditCustomer} />
            <Route path="/parties/customers/ledger/:storeId/:customerId" component={CustomerLedger} />
            <Route path="/parties/customers" component={Customers} />

            <Route path="/parties/suppliers/makepayment/:storeId/:supplierId" component={MakeSupplierPayment} />
            <Route path="/parties/suppliers/editpayment/:supplierId/:txnId" component={EditSupplierPayment} />
            <Route path="/parties/suppliers/new" component={CreateSupplier} />
            <Route path="/parties/suppliers/edit/:storeId/:supplierId" component={EditSupplier} />
            <Route path="/parties/suppliers/ledger/:storeId/:supplierId" component={SupplierLedger} />
            <Route path="/parties" component={Suppliers} />
          </Switch>
        </Box>
      </Paper>
    </Box>
  )
}

export default connect(null, null)(PartiesRouter);