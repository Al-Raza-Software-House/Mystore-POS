import React, { useState } from 'react';
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
import PrintSupplierTxn from './suppliers/PrintSupplierTxn';
import PrintCustomerTxn from './customers/PrintCustomerTxn';
import {isSalesperson} from '../../utils/index';
import { useMemo } from 'react';

const useStyles = makeStyles(theme => ({
  paper:{
    width: 'inherit',
  }
}))

let menues = [
  {to: '/parties', title: 'Suppliers'},
  {to: '/parties/customers', title: 'Customers'}
]

function PartiesRouter({ userRole }){
  const classes = useStyles();
  const [printSupplierTxn, setPrintSupplierTxn] = useState(null);
  const [printCustomerTxn, setPrintCustomerTxn] = useState(null);
  const tabs = useMemo(() => {
    if(isSalesperson(userRole))
      return [{to: '/parties/customers', title: 'Customers'}];
    return menues;
  }, [userRole]);
  return(
    <Box display="flex" flexDirection="column" justifyContent="space-between" height="100%">
      <PrintSupplierTxn txn={printSupplierTxn} setTxn={setPrintSupplierTxn} />
      <PrintCustomerTxn txn={printCustomerTxn} setTxn={setPrintCustomerTxn} />
      <Paper className={classes.paper} square>
        <Box>
          <Box px={3} pt={0}>
            <StyledTabs menues={tabs} />
          </Box>
        </Box>
      </Paper>
      <Paper className={classes.paper} style={{flexGrow: 1}} variant="outlined" square>
        <Box px={3} pt={2} >
          <Switch>
            <Route path="/parties/customers/receivepayment/:storeId/:customerId" render={ props => <ReceiveCustomerPayment {...props} printTxn={setPrintCustomerTxn} />} />
            <Route path="/parties/customers/editpayment/:customerId/:txnId" render={ props => <EditCustomerPayment {...props} printTxn={setPrintCustomerTxn} />} />
            <Route path="/parties/customers/new" component={CreateCustomer} />
            <Route path="/parties/customers/edit/:storeId/:customerId" component={EditCustomer} />
            <Route path="/parties/customers/ledger/:storeId/:customerId" render={ props => <CustomerLedger {...props} printTxn={setPrintCustomerTxn} /> } />
            <Route path="/parties/customers" component={Customers} />

            <Route path="/parties/suppliers/makepayment/:storeId/:supplierId" render={ props => <MakeSupplierPayment {...props} printTxn={setPrintSupplierTxn} />} />
            <Route path="/parties/suppliers/editpayment/:supplierId/:txnId" render={ props => <EditSupplierPayment {...props} printTxn={setPrintSupplierTxn} />} />
            <Route path="/parties/suppliers/new" component={CreateSupplier} />
            <Route path="/parties/suppliers/edit/:storeId/:supplierId" component={EditSupplier} />
            <Route path="/parties/suppliers/ledger/:storeId/:supplierId" render={ props => <SupplierLedger {...props} printTxn={setPrintSupplierTxn} /> } />
            <Route path="/parties" component={Suppliers} />
          </Switch>
        </Box>
      </Paper>
    </Box>
  )
}

const mapStateToProps = (state) => {
  return {
   userRole: state.stores.userRole,
  }
}

export default connect(mapStateToProps, null)(PartiesRouter);