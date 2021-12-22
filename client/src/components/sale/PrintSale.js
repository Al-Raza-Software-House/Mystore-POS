import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Dialog, Typography, DialogActions, Button, DialogContent, Box } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import moment from 'moment';
import { payOrCreditOptions } from '../../../utils/constants';

const cellStyle = { border: '1px solid black', textAlign: "center", borderSpacing: "0px", padding: "3px 10px", boxSizing: "border-box" };

function PrintSale(props){
  const { grn, setGrn } = props;
  const [open, setOpen] = useState(false);
  const handleClose = () => {
    setOpen(false);
    setGrn(false);
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
  
  const items = useSelector(state => {
    let storeId = state.stores.selectedStoreId;
    return state.items[storeId].allItems? state.items[storeId].allItems : [];
  });
  
  const itemMaps = useMemo(() => {
    let newMap = {};
    if(!grn) return newMap;
    grn.items.forEach(record => {
      let item = items.find(item => item._id === record._id);
      if(item)
        newMap[item._id] = item;
    });
    return newMap;
  }, [items, grn]);

  const printReceipt = useCallback(() => {
    var mywindow = window.open('', 'PRINT', 'height=600,width=800');
      mywindow.document.write('<html><head><title>Goods Receipt Note</title>');
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

  const totalItemAmount = useMemo(() => {
    if(!grn) return 0;
    let total = 0;
    grn.items.forEach(item => {
      let costPrice = item.costPrice;
      let quantity = item.quantity;
      let adjustment = item.adjustment * quantity;
      let tax = item.tax * quantity;
      total += costPrice * quantity;
      total += tax;
      total -= adjustment;
    });
    return (+total.toFixed(2)).toLocaleString()

  }, [grn]);

  useEffect(() => {
    if(grn)
      setOpen(true);
    else
      setOpen(false);
  }, [grn])

  return(
    <Dialog open={open} fullWidth maxWidth="xs" onClose={handleClose} aria-labelledby="form-dialog-title">
      {
        !grn ?  null :
        <DialogContent>
          <Box id="receipt-container" style={{ backgroundColor: '#ececec', padding: '0px 10px' }} maxWidth="80mm" margin="auto">
            <Box style={{ fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', padding: "16px 0px", maxWidth: "80mm" }}>
              <Typography style={{ marginTop: "0px", marginBottom: "0px", fontSize: 20, textAlign: "center" }}>Goods Receipt Note</Typography>
              <Typography style={{ marginTop: "0px", marginBottom: "0px", fontSize: 18, textAlign: "center" }}>{ store.name }</Typography>
              <Typography style={{ marginTop: "0px", marginBottom: "0px", fontSize: 12, textAlign: "center" }}>{ store.address }</Typography>
              <Typography style={{ marginTop: "0px", marginBottom: "8px", fontSize: 12, textAlign: "center" }}>{ store.phone1 }</Typography>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center" }}>
                <Typography style={{ fontSize: "12px", margin: "0px" }}><span style={{ fontWeight: "bold" }}>Invoice #:</span> { grn.supplierInvoiceNumber }</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px", marginLeft: "8px" }}><span style={{ fontWeight: "bold" }}>Date:</span> { moment(grn.grnDate).format("DD MMM, YYYY") }</Typography>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center" }}>
                <Typography style={{ fontSize: "12px", margin: "0px" }}><span style={{ fontWeight: "bold" }}>GRN #:</span> { grn.grnNumber }</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px", marginLeft: "8px" }}><span style={{ fontWeight: "bold" }}>Bill:</span> { grn.billNumber }</Typography>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography style={{ fontSize: "12px", fontWeight: "bold", margin: "0px" }}>Supplier:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px" }}>{ grn.supplier.name }</Typography>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography style={{ fontSize: "12px", fontWeight: "bold", margin: "0px" }}>Bill Date:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px" }}>{ moment(grn.billDate).format("DD MMM, YYYY") }</Typography>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography style={{ fontSize: "12px", fontWeight: "bold", margin: "0px" }}>Bill Due Date:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px" }}>{ moment(grn.billDueDate).format("DD MMM, YYYY") }</Typography>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography style={{ fontSize: "12px", fontWeight: "bold", margin: "0px" }}>Payment Mode</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px" }}>{ grn.payOrCredit === payOrCreditOptions.ON_CREDIT ? "Credit" : (grn.bankId ? banks[grn.bankId].name : "Cash") }</Typography>
              </div>
              {
                grn.payOrCredit === payOrCreditOptions.ON_CREDIT || !grn.bankId ? null : 
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography style={{ fontSize: "12px", fontWeight: "bold", margin: "0px" }}>Cheque No./Txn ID</Typography>
                  <Typography style={{ fontSize: "12px", margin: "0px" }}>{ grn.chequeTxnId }</Typography>
                </div>
              }
              
              { 
                grn.notes ?
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography style={{ fontSize: "12px", fontWeight: "bold", margin: "0px" }}>Notes:</Typography>
                  <Typography style={{ fontSize: "12px", margin: "0px" }}>{ grn.notes }</Typography>
                </div>
                : null
              }
              
              <Box id="table-container" style={{ padding: "0px 4px" }}>
                <table style={{ width: "100%", marginTop: "8px", fontSize: '12px', "borderCollapse": "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{...cellStyle, textAlign: "left"}} >Item</th>
                      <th style={cellStyle} >Cost</th>
                      <th style={cellStyle} >Qty</th>
                      <th style={cellStyle} >Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      grn.items.map(item => (
                        <tr key={item._id}>
                          <td style={{...cellStyle, textAlign: "left"}} >
                            <span>{itemMaps[item._id].itemCode}{itemMaps[item._id].sizeCode ? '-'+itemMaps[item._id].sizeCode+'-'+itemMaps[item._id].combinationCode : '' }</span> 
                            <br/>
                            <span>{itemMaps[item._id].itemName}</span>
                            {
                              itemMaps[item._id].sizeName ?
                              <span> <br/>{itemMaps[item._id].sizeName} | {itemMaps[item._id].combinationName} </span>
                              : null
                            }
                          </td>
                          <td style={cellStyle} > { item.costPrice.toLocaleString() } </td>
                          <td style={cellStyle} > { item.quantity.toLocaleString() } </td>
                          <td style={cellStyle} > { ( +( ( (item.costPrice * item.quantity) + (item.tax * item.quantity)) - (item.adjustment * item.quantity)).toFixed(2) ).toLocaleString() } </td>
                        </tr>
                      ))
                    }
                    <tr>
                      <td style={cellStyle} colSpan="2"> <b>Total</b> </td>
                      <td style={cellStyle}>{ grn.totalQuantity }</td>
                      <td style={cellStyle}>{ totalItemAmount }</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ display: "flex", justifyContent: "space-between", margin: "10px 0px", flexWrap: "wrap" }}>
                  { grn.loadingExpense === 0 ? null : <Typography style={{ fontSize: "12px", width: "45%", margin: "0px"}}>Loading Expense: <b>{ grn.loadingExpense.toLocaleString() } </b></Typography> }
                  { grn.freightExpense === 0 ? null : <Typography style={{ fontSize: "12px", width: "45%", margin: "0px" }}>Freight Expense: <b>{ grn.freightExpense.toLocaleString() } </b></Typography> }
                  { grn.otherExpense === 0 ? null : <Typography style={{ fontSize: "12px", width: "45%", margin: "0px" }}>Other Expense: <b>{ grn.otherExpense.toLocaleString() } </b></Typography> }
                  { grn.adjustmentAmount === 0 ? null : <Typography style={{ fontSize: "12px", width: "45%", margin: "0px" }}>Adjustment: <b>{ grn.adjustmentAmount.toLocaleString() } </b></Typography> }
                  { grn.purchaseTax === 0 ? null : <Typography style={{ fontSize: "12px", width: "45%", margin: "0px" }}>Purchase Tax: <b>{ grn.purchaseTax.toLocaleString() } </b></Typography> }
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", margin: "10px 15px", }}>
                  <Typography style={{ fontSize: "12px", margin: "0px", textAlign: "left" }}>Total Items: <b>{ grn.items.length } </b></Typography>
                  <Typography style={{ fontSize: "12px", margin: "0px", textAlign: "center" }}>Net Total: <b>{ grn.totalAmount.toLocaleString() } </b></Typography>
                </div>
              </Box>
              <div style={{ visibility: "hidden" }}>.</div>
              <Box style={{ display: "flex", justifyContent: "space-between", padding: "0px 8px", marginBottom: "16px", marginTop: "10px" }} >
                <Box style={{ borderTop: "1px solid black", textAlign: "center", width: "45%", paddingTop: "8px", fontSize: '12px' }} > Received By </Box>
                <Box style={{ borderTop: "1px solid black", textAlign: "center", width: "45%", paddingTop: "8px", fontSize: '12px' }}> Approved By </Box>
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

export default PrintSale;