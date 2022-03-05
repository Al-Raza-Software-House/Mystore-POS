import React, { useState } from 'react';
import { makeStyles, Paper, Box } from '@material-ui/core';
import StyledTabs from '../library/StyledTabs';
import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import PurchaseOrders from './purchaseOrders/PurchaseOrders';
import CreatePurchaseOrder from './purchaseOrders/CreatePurchaseOrder';
import EditPurchaseOrder from './purchaseOrders/EditPurchaseOrder';
import PrintPurchaseOrder from './purchaseOrders/PrintPurchaseOrder';
import PrintGRN from './grn/PrintGrn';
import Grns from './grn/Grns';
import CreateGrn from './grn/CreateGrn';
import EditGrn from './grn/EditGrn';
import Rtvs from './rtv/Rtvs';
import CreateRtv from './rtv/CreateRtv';
import EditRtv from './rtv/EditRtv';
import PrintRtv from './rtv/PrintRtv';

const useStyles = makeStyles(theme => ({
  paper:{
    width: 'inherit',
  }
}))

const menues = [
  {to: '/purchase', title: 'Purchase Orders'},
  {to: '/purchase/grns', title: 'Goods Receipt Note(GRN)'},
  {to: '/purchase/rtvs', title: 'Return to Vendor(RTV)'},
  {to: '/purchase/barcodes', title: 'Print Barcodes'},
]

function PurchaseRouter(){
  const classes = useStyles();
  const [pintPo, setPrintPo] = useState(null);
  const [printGRN, setPrintGRN] = useState(null);
  const [printRTV, setPrintRTV] = useState(null);

  return(
    <Box display="flex" flexDirection="column" justifyContent="space-between" height="100%">
      <PrintPurchaseOrder order={pintPo} setOrder={setPrintPo} />
      <PrintGRN grn={printGRN} setGrn={setPrintGRN} />
      <PrintRtv rtv={printRTV} setRtv={setPrintRTV} />
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
            
            <Route path="/purchase/rtvs/edit/:storeId/:rtvId" render={props => <EditRtv {...props} printRtv={setPrintRTV} />} />
            <Route path="/purchase/rtvs/new" render={props => <CreateRtv {...props} printRtv={setPrintRTV} />} />
            <Route path="/purchase/rtvs" render={props => <Rtvs {...props} printRtv={setPrintRTV} />} />

            <Route path="/purchase/grns/edit/:storeId/:grnId" render={props => <EditGrn {...props} printGrn={setPrintGRN} />} />
            <Route path="/purchase/grns/new" render={props => <CreateGrn {...props} printGrn={setPrintGRN} />} />
            <Route path="/purchase/grns" render={props => <Grns {...props} printGrn={setPrintGRN} />} />

            <Route path="/purchase/orders/edit/:storeId/:poId" render={props => <EditPurchaseOrder {...props} printPo={setPrintPo} />} />
            <Route path="/purchase/orders/new" render={props => <CreatePurchaseOrder {...props} printPo={setPrintPo} />} />
            <Route path="/purchase" render={props => <PurchaseOrders {...props} printPo={setPrintPo} />} />
          </Switch>
        </Box>
      </Paper>
    </Box>
  )
}

export default connect(null, null)(PurchaseRouter);