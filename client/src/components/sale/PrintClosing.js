import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Dialog, Typography, DialogActions, Button, DialogContent, Box } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import moment from 'moment';

function PrintClosing(props){
  const { closing, setClosing } = props;
  const [open, setOpen] = useState(false);
  const handleClose = () => {
    setOpen(false);
    setClosing(false);
  };
  const store = useSelector(state => {
    let storeId = state.stores.selectedStoreId;
    return state.stores.stores.find(record => record._id === storeId);
  });

  const user = useMemo(() => {
    if(!closing) return null;
    let user = store.users.find(user => user.record._id === closing.userId);
    return user ? user.record : null;
  }, [store, closing]);


  const printReceipt = useCallback(() => {
    var mywindow = window.open('', 'PRINT', 'height=600,width=800');
      mywindow.document.write('<html><head><title>Sale Receipt</title>');
      mywindow.document.write('</head><body >');
      mywindow.document.write('<style type="text/css"> @media print { #table-container{ margin-bottom: 10mm; } }  </style>')
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
    if(closing)
    {
      setOpen(true);
    }
    else
      setOpen(false);
  }, [closing, printReceipt])

  return(
    <Dialog open={open} fullWidth maxWidth="xs" onClose={handleClose} aria-labelledby="form-dialog-title">
      {
        !closing ?  null :
        <DialogContent>
          <Box id="receipt-container" style={{ backgroundColor: '#ececec', padding: '0px 10px' }} maxWidth="80mm" margin="auto">
            <Box style={{ fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', padding: "16px 0px", maxWidth: "80mm" }}>
              <Typography style={{ marginTop: "0px", marginBottom: "0px", fontSize: 20, textAlign: "center" }}>End Of Day Report</Typography>
              <Typography style={{ marginTop: "0px", marginBottom: "0px", fontSize: 18, textAlign: "center" }}>{ store.name }</Typography>
              <Typography style={{ marginTop: "0px", marginBottom: "0px", fontSize: 12, textAlign: "center" }}>{ store.address }</Typography>
              <Typography style={{ marginTop: "0px", marginBottom: "8px", fontSize: 12, textAlign: "center" }}>{ store.phone1 }</Typography>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center" }}>
                <Typography style={{ fontSize: "12px", margin: "0px", fontWeight: "bold" }}>Start Date:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px", marginLeft: "8px" }}>{ moment(closing.startTime).format("DD MMM, YYYY hh:mm:ss A") }</Typography>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center", marginBottom: 30 }}>
                <Typography style={{ fontSize: "12px", margin: "0px", fontWeight: "bold" }}>End Date:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px", marginLeft: "8px" }}>{ moment(closing.endTime).format("DD MMM, YYYY hh:mm:ss A") }</Typography>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center" }}>
                <Typography style={{ fontSize: "12px", margin: "0px", fontWeight: "bold" }}>Admin:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px", marginLeft: "8px" }}>{ user.name }</Typography>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center" }}>
                <Typography style={{ fontSize: "12px", margin: "0px", fontWeight: "bold" }}>Opening Cash:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px", marginLeft: "8px" }}>{ closing.openingCash.toLocaleString() }</Typography>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center" }}>
                <Typography style={{ fontSize: "12px", margin: "0px", fontWeight: "bold" }}>Total inFlow:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px", marginLeft: "8px" }}>{ closing.totalInflow.toLocaleString() }</Typography>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center", paddingBottom: 10, borderBottom: "1px solid #000", marginBottom: 20 }}>
                <Typography style={{ fontSize: "12px", margin: "0px", fontWeight: "bold" }}>Total outFlow:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px", marginLeft: "8px" }}>{ closing.totalOutflow.toLocaleString() }</Typography>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center", paddingBottom: 5 }}>
                <Typography style={{ fontSize: "12px", margin: "0px", fontWeight: "bold" }}>Expected Cash:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px", marginLeft: "8px" }}>{ closing.expectedCash.toLocaleString() }</Typography>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center", paddingBottom: 10, borderBottom: "1px solid #000", marginBottom: 20 }}>
                <Typography style={{ fontSize: "12px", margin: "0px" }}>(Opening Cash + Total inFlow - Total outFlow)</Typography>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center", paddingBottom: 5 }}>
                <Typography style={{ fontSize: "12px", margin: "0px", fontWeight: "bold" }}>Physical/Closing Cash:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px", marginLeft: "8px" }}>{ closing.cashCounted.toLocaleString() }</Typography>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center", paddingBottom: 5 }}>
                <Typography style={{ fontSize: "12px", margin: "0px", fontWeight: "bold" }}>Cash Difference:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px", marginLeft: "8px" }}>{ closing.cashDifference.toLocaleString() }</Typography>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center", paddingBottom: 10, borderBottom: "1px solid #000", marginBottom: 20 }}>
                <Typography style={{ fontSize: "12px", margin: "0px" }}>(Physical cash - Expected cash)</Typography>
              </div>




              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center", marginBottom: 10 }}>
                <Typography style={{ fontSize: "18px", margin: "0px", fontWeight: "bold" }}>In Flows</Typography>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center" }}>
                <Typography style={{ fontSize: "12px", margin: "0px", fontWeight: "bold" }}>Cash Sales:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px", marginLeft: "8px" }}>{ closing.inflows.cashSales.toLocaleString() }</Typography>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center" }}>
                <Typography style={{ fontSize: "12px", margin: "0px", fontWeight: "bold" }}>Customer Credit Payments:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px", marginLeft: "8px" }}>{ closing.inflows.customerCreditPayments.toLocaleString() }</Typography>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center" }}>
                <Typography style={{ fontSize: "12px", margin: "0px", fontWeight: "bold" }}>Income:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px", marginLeft: "8px" }}>{ closing.inflows.income.toLocaleString() }</Typography>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center" }}>
                <Typography style={{ fontSize: "12px", margin: "0px", fontWeight: "bold" }}>Cash From Bank:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px", marginLeft: "8px" }}>{ closing.inflows.cashFromBank.toLocaleString() }</Typography>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center" }}>
                <Typography style={{ fontSize: "12px", margin: "0px", fontWeight: "bold" }}>Other:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px", marginLeft: "8px" }}>{ closing.inflows.other.toLocaleString() }</Typography>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center", borderTop: "1px dotted #000", borderBottom: "1px solid #000", marginBottom: 20, marginTop: 10 }}>
                <Typography style={{ fontSize: "12px", fontWeight: "bold", margin: "10px 0px" }}>Total inFlows</Typography>
                <Typography style={{ fontSize: "12px", fontWeight: "bold", margin: "10px 0px" }}>{ closing.totalInflow.toLocaleString() }</Typography>
              </div>

              

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center", marginBottom: 10 }}>
                <Typography style={{ fontSize: "18px", margin: "0px", fontWeight: "bold" }}>Out Flows</Typography>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center" }}>
                <Typography style={{ fontSize: "12px", margin: "0px", fontWeight: "bold" }}>Cash Purchases:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px", marginLeft: "8px" }}>{ closing.outflows.cashPurchases.toLocaleString() }</Typography>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center" }}>
                <Typography style={{ fontSize: "12px", margin: "0px", fontWeight: "bold" }}>Supplier Payments:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px", marginLeft: "8px" }}>{ closing.outflows.supplierPayments.toLocaleString() }</Typography>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center" }}>
                <Typography style={{ fontSize: "12px", margin: "0px", fontWeight: "bold" }}>Expenses:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px", marginLeft: "8px" }}>{ closing.outflows.expenses.toLocaleString() }</Typography>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center" }}>
                <Typography style={{ fontSize: "12px", margin: "0px", fontWeight: "bold" }}>Cash To Bank:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px", marginLeft: "8px" }}>{ closing.outflows.cashToBank.toLocaleString() }</Typography>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center" }}>
                <Typography style={{ fontSize: "12px", margin: "0px", fontWeight: "bold" }}>Other:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px", marginLeft: "8px" }}>{ closing.outflows.other.toLocaleString() }</Typography>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center", borderTop: "1px dotted #000", borderBottom: "1px solid #000", marginBottom: 20, marginTop: 10 }}>
                <Typography style={{ fontSize: "12px", fontWeight: "bold", margin: "10px 0px" }}>Total outFlows</Typography>
                <Typography style={{ fontSize: "12px", fontWeight: "bold", margin: "10px 0px" }}>{ closing.totalOutflow.toLocaleString() }</Typography>
              </div>

              
              { 
                closing.notes ?
                <div style={{ textAlign: "center" }}>
                  <Typography style={{ fontSize: "12px", fontWeight: "bold", margin: "0px", marginBottom: 5 }}>Notes:</Typography>
                  <Typography style={{ fontSize: "12px", margin: "0px" }}>{ closing.notes }</Typography>
                </div>
                : null
              }
              
              
              
              <Box style={{ fontSize: 12, padding: "0px 8px", textAlign: "center", marginTop: "10px" }} id="app-name" >
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

export default PrintClosing;