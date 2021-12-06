import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, Typography, DialogActions, Button, DialogContent, Box, Table, TableBody, TableRow, TableCell } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import moment from 'moment';

function PrintSupplierTxn(props){
  const { txn, setTxn } = props;
  const [open, setOpen] = useState(false);
  const handleClose = () => {
    setOpen(false);
    setTxn(false);
  };
  const store = useSelector(state => {
    let storeId = state.stores.selectedStoreId;
    return state.stores.stores.find(record => record._id === storeId);
  });

  const banks = useSelector(state => {
    let storeId = state.stores.selectedStoreId;
    let bankMaps = {};
    let banks = state.accounts.banks[storeId] ? state.accounts.banks[storeId] : [];
    banks.forEach(bank => bankMaps[bank._id] = bank)
    return bankMaps;
  });
  
  const printReceipt = useCallback(() => {
    var mywindow = window.open('', 'PRINT', 'height=600,width=800');
      mywindow.document.write('<html><head><title>Supplier Payment slip</title>');
      mywindow.document.write('</head><body >');
      mywindow.document.write('<style type="text/css"> @media print { #table-container{ margin-bottom: 40mm; } }  </style>')
      mywindow.document.write('<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />');
      mywindow.document.write(document.getElementById("receipt-container").innerHTML);
      mywindow.document.write('</body></html>');

      mywindow.document.close(); // necessary for IE >= 10
      mywindow.focus(); // necessary for IE >= 10*/

     setTimeout(() => {
        mywindow.print();
        mywindow.close();
     }, 200)

      return true;
  }, []);

  useEffect(() => {
    if(txn)
      setOpen(true);
    else
      setOpen(false);
  }, [txn])

  return(
    <Dialog open={open} fullWidth maxWidth="xs" onClose={handleClose} aria-labelledby="form-dialog-title">
      {
        !txn ?  null :
        <DialogContent>
          <Box id="receipt-container" style={{ backgroundColor: '#ececec' }} maxWidth="80mm" margin="auto">
            <Box style={{ fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', padding: "16px 0px", maxWidth: "80mm" }}>
              <Typography style={{ marginTop: "0px", marginBottom: "8px", fontSize: 20, textAlign: "center" }}>Supplier Payment Slip</Typography>
              <Typography style={{ marginTop: "0px", marginBottom: "0px", fontSize: 18, textAlign: "center" }}>{ store.name }</Typography>
              <Typography style={{ marginTop: "0px", marginBottom: "0px", fontSize: 12, textAlign: "center" }}>{ store.address }</Typography>
              <Typography style={{ marginTop: "0px", marginBottom: "8px", fontSize: 12, textAlign: "center" }}>{ store.phone1 }</Typography>

              <Typography style={{ marginTop: "0px", marginBottom: "10px", fontSize: 12, textAlign: "center" }}>Payment Date: { moment(txn.time).format("DD MMMM, YYYY") }</Typography>
              <Typography style={{ marginTop: "0px", marginBottom: "8px", fontSize: 16, textAlign: "center" }}>Supplier: { txn.supplier.name }</Typography>
              
              <Typography style={{ marginTop: "0px", marginBottom: "0px", fontSize: 12, textAlign: "center" }}>Amount { txn.amount < 0 ? "paid to" : "received from" } supplier <br/> <span style={{ fontSize: 16 }}>Rs.{ (+Math.abs(txn.amount).toFixed(2)).toLocaleString() } </span> </Typography>
              <Typography style={{ marginTop: "0px", marginBottom: "16px", fontSize: 12, textAlign: "center" }}>Mode of payment: { txn.bankId ? banks[txn.bankId].name : "Cash" }</Typography>
              { 
                txn.notes ?
                <Typography style={{ marginTop: "0px", marginBottom: "8px", fontSize: 12, textAlign: "center" }}>Notes: <br/> { txn.notes }</Typography>
                : null
              }
              <Typography style={{ fontSize: 16, textAlign: "center" }}>Ledger Details</Typography>
              <Typography style={{ fontSize: 12, textAlign: "center" }}>Ledger Date: { moment().format("DD MMMM, YYYY") }</Typography>
              <Box px={4} style={{ padding: "0px 8px" }} id="table-container">
                <Table size="small" style={{ width: "100%", marginTop: "8px", fontSize: '12px' }}>
                  <TableBody>
                    <TableRow>
                      <TableCell style={{ padding: "0px 16px", height: "25px", borderBottom: "none", fontSize: '12px' }}>Opening Balance</TableCell>
                      <TableCell style={{ padding: "0px 16px", height: "25px", borderBottom: "none", textAlign: "center", fontSize: '12px' }}> { (+txn.supplier.openingBalance.toFixed(2)).toLocaleString() } </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ padding: "0px 16px", height: "25px", borderBottom: "none", fontSize: '12px' }}>Total Purchases</TableCell>
                      <TableCell style={{ padding: "0px 16px", height: "25px", borderBottom: "none", textAlign: "center", fontSize: '12px' }}> { (+txn.supplier.totalPurchases.toFixed(2)).toLocaleString() } </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ padding: "0px 16px", height: "25px", borderBottom: "none", fontSize: '12px' }}>Total Returns</TableCell>
                      <TableCell style={{ padding: "0px 16px", height: "25px", borderBottom: "none", textAlign: "center", fontSize: '12px' }}> { (+txn.supplier.totalReturns.toFixed(2)).toLocaleString() } </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ padding: "0px 16px", height: "25px", borderBottom: "none", fontSize: '12px' }}>Amount Paid</TableCell>
                      <TableCell style={{ padding: "0px 16px", height: "25px", borderBottom: "none", textAlign: "center", fontSize: '12px' }}> { (+txn.supplier.totalPayment.toFixed(2)).toLocaleString() } </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ padding: "0px 16px", height: "25px", borderBottom: "none", fontSize: '12px' }}>Net Payable</TableCell>
                      <TableCell style={{ padding: "0px 16px", height: "25px", borderBottom: "none", textAlign: "center", fontSize: '12px' }}> { (+txn.supplier.currentBalance.toFixed(2)).toLocaleString() } </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <div style={{ visibility: "hidden" }}>.</div>
              </Box>
              <Box style={{ display: "flex", justifyContent: "space-between", padding: "0px 8px", marginBottom: "16px" }} >
                <Box style={{ borderTop: "1px solid black", textAlign: "center", width: "45%", paddingTop: "8px", fontSize: '12px' }} > Received by </Box>
                <Box style={{ borderTop: "1px solid black", textAlign: "center", width: "45%", paddingTop: "8px", fontSize: '12px' }}> Signature </Box>
              </Box>
              <Box style={{ fontSize: 12, padding: "0px 8px", textAlign: "center" }} id="app-name" >
                { process.env.REACT_APP_PRINT_FOOTER }
              </Box>
            </Box>
          </Box>
        </DialogContent>
      }
      <DialogActions style={{ justifyContent: 'center' }}>
        <Button disableElevation type="button" variant="contained" startIcon={<FontAwesomeIcon icon={faPrint} />} onClick={printReceipt} color="primary">
          Print
        </Button>
        <Button disableElevation type="button" variant="outlined" onClick={handleClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PrintSupplierTxn;