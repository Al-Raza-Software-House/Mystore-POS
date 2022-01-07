import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Dialog, Typography, DialogActions, Button, DialogContent, Box } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import moment from 'moment';

const cellStyle = { borderTop: '1px dotted black', textAlign: "center", borderSpacing: "0px", padding: "3px 10px", boxSizing: "border-box" };

function PrintSale(props){
  const { sale, setSale } = props;
  const [open, setOpen] = useState(false);
  const handleClose = () => {
    setOpen(false);
    setSale(false);
  };
  const store = useSelector(state => {
    let storeId = state.stores.selectedStoreId;
    return state.stores.stores.find(record => record._id === storeId);
  });

  const user = useMemo(() => {
    if(!sale) return null;
    let user = store.users.find(user => user.record._id === sale.userId);
    return user ? user.record : null;
  }, [store, sale]);

  const customer = useSelector(state => {
    if(!sale || !sale.customerId) return null;
    let storeId = state.stores.selectedStoreId;
    return state.customers[storeId].find(record => record._id === sale.customerId);
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
    if(!sale) return newMap;
    sale.items.forEach(record => {
      let item = items.find(item => item._id === record._id);
      if(item)
        newMap[item._id] = item;
    });
    return newMap;
  }, [items, sale]);

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

  const stats = useMemo(() => {
    let stats = {
      totalItems: 0,
      totalQuantity: 0,
      totalAmount: 0,
      totalDiscount: 0
    }
    if(!sale) return stats;
    sale.items.forEach(item => {
      if(item.isVoided) return;

      let salePrice = Number(item.salePrice);
      let quantity = Number(item.quantity);
      let discount = Number(item.discount);
      stats.totalItems += 1;
      stats.totalQuantity += quantity;
      stats.totalAmount += salePrice * quantity;
      stats.totalDiscount += discount * quantity;
    });
    return stats;

  }, [sale]);

  const netTotal = useMemo(() => {
    if(!sale) return 0;
    return +((stats.totalAmount - stats.totalDiscount) + Number(sale.adjustment)).toFixed(2);
  }, [stats, sale])

  const totalPayment = useMemo(() => {
    if(!sale) return 0;
    let cash = isNaN(sale.cashPaid) ? 0 : Number(sale.cashPaid);
    let credit = isNaN(sale.creditAmount) ? 0 : Number(sale.creditAmount);
    let bank = isNaN(sale.bankAmount) ? 0 : Number(sale.bankAmount);
    let total = +( cash + credit + bank ).toFixed(2);
    return total;
    
  }, [sale]);

  useEffect(() => {
    if(sale)
    {
      setOpen(true);
      if(sale.printSalesReceipt)
        setTimeout(() => {
          printReceipt();
          setOpen(false);
        }, 100)
    }
    else
      setOpen(false);
  }, [sale, printReceipt])

  return(
    <Dialog open={open} fullWidth maxWidth="xs" onClose={handleClose} aria-labelledby="form-dialog-title">
      {
        !sale ?  null :
        <DialogContent>
          <Box id="receipt-container" style={{ backgroundColor: '#ececec', padding: '0px 10px' }} maxWidth="80mm" margin="auto">
            <Box style={{ fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', padding: "16px 0px", maxWidth: "80mm" }}>
              <Typography style={{ marginTop: "0px", marginBottom: "0px", fontSize: 20, textAlign: "center" }}>{ store.receiptSettings.receiptTitle }</Typography>
              <Typography style={{ marginTop: "0px", marginBottom: "0px", fontSize: 18, textAlign: "center" }}>{ store.name }</Typography>
              <Typography style={{ marginTop: "0px", marginBottom: "0px", fontSize: 12, textAlign: "center" }}>{ store.address }</Typography>
              <Typography style={{ marginTop: "0px", marginBottom: "8px", fontSize: 12, textAlign: "center" }}>{ store.phone1 }</Typography>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center" }}>
                <Typography style={{ fontSize: "12px", margin: "0px" }}>
                  { 
                    store.receiptSettings.printSaleId ?
                    <>
                    <span style={{ fontWeight: "bold" }}> Receipt #:</span> { sale.saleNumber }
                    </> : null
                  }
                </Typography>
                <Typography style={{ fontSize: "12px", margin: "0px", marginLeft: "8px" }}><span style={{ fontWeight: "bold" }}>Date:</span> { moment(sale.saleDate).format("DD MMM, YYYY hh:mm A") }</Typography>
              </div>

              {
                store.receiptSettings.printSalesperson && user ? 
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography style={{ fontSize: "12px", fontWeight: "bold", margin: "0px" }}>Salesperson:</Typography>
                  <Typography style={{ fontSize: "12px", margin: "0px" }}>{ user.name }</Typography>
                </div>
                : null
              }
              {
                store.receiptSettings.printCustomerName && customer ? 
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography style={{ fontSize: "12px", fontWeight: "bold", margin: "0px" }}>Customer:</Typography>
                  <Typography style={{ fontSize: "12px", margin: "0px" }}>{ customer.name }</Typography>
                </div>
                : null
              }
              
              
              
              { 
                store.receiptSettings.printSaleNotes && sale.notes ?
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography style={{ fontSize: "12px", fontWeight: "bold", margin: "0px" }}>Notes:</Typography>
                  <Typography style={{ fontSize: "12px", margin: "0px" }}>{ sale.notes }</Typography>
                </div>
                : null
              }
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography style={{ fontSize: "12px", fontWeight: "bold", margin: "0px" }}>Total Items: &nbsp; { stats.totalItems }</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px" }}></Typography>
              </div>
              
              <Box id="table-container" style={{ padding: "0px 4px" }}>
                <table style={{ width: "100%", marginTop: "8px", fontSize: '12px', "borderCollapse": "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{...cellStyle, textAlign: "left", borderTop: "1px solid black", borderBottom: "1px solid black"}} >Item</th>
                      <th style={{...cellStyle, borderTop: "1px solid black", borderBottom: "1px solid black"}} >Price</th>
                      <th style={{...cellStyle, borderTop: "1px solid black", borderBottom: "1px solid black"}} >Qty</th>
                      <th style={{...cellStyle, borderTop: "1px solid black", borderBottom: "1px solid black"}} >Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      sale.items.map(item => item.isVoided ? null :
                      (
                        <tr key={item._id}>
                          <td style={{...cellStyle, textAlign: "left"}} >
                            {
                              store.receiptSettings.printItemCode ? 
                              <>
                              <span>{itemMaps[item._id].itemCode}{itemMaps[item._id].sizeCode ? '-'+itemMaps[item._id].sizeCode+'-'+itemMaps[item._id].combinationCode : '' }</span> 
                              <br/> 
                              </> : null
                            }
                            {
                              store.receiptSettings.printItemName ? <span>{itemMaps[item._id].itemName}</span> : null
                            }
                          </td>
                          <td style={cellStyle} > { item.salePrice.toLocaleString() } </td>
                          <td style={cellStyle} > { item.quantity.toLocaleString() } </td>
                          <td style={cellStyle} > { ( +(Number(item.salePrice) * Number(item.quantity)).toFixed(2) ).toLocaleString() } </td>
                        </tr>
                      ))
                    }
                    <tr>
                      <td style={{...cellStyle, borderTop: "1px solid black", borderBottom: "1px solid black"}} colSpan="2"> <b>Total</b> </td>
                      <td style={{...cellStyle, borderTop: "1px solid black", borderBottom: "1px solid black"}}>{ stats.totalQuantity }</td>
                      <td style={{...cellStyle, borderTop: "1px solid black", borderBottom: "1px solid black"}}>{ stats.totalAmount }</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", margin: "10px 15px", }}>
                  {
                    stats.totalDiscount > 0 ?
                    <>
                      <div style={{ fontSize: "12px", margin: "0px", textAlign: "right", fontWeight: "bold", width: "70%" }}>Discount: </div>
                      <div style={{ fontSize: "12px", margin: "0px", textAlign: "right", width: "30%" }}>{  (+stats.totalDiscount.toFixed(2)).toLocaleString() } </div>
                    </> : null
                  }
                  {
                    Number(sale.adjustment) !== 0 ?
                    <>
                      <div style={{ fontSize: "12px", margin: "0px", textAlign: "right", fontWeight: "bold", width: "70%" }}>Adjustment: </div>
                      <div style={{ fontSize: "12px", margin: "0px", textAlign: "right", width: "30%" }}>{  (+Number(sale.adjustment).toFixed(2)).toLocaleString() } </div>
                    </> : null
                  }
                  <div style={{ fontSize: "12px", margin: "0px", textAlign: "right", fontWeight: "bold", width: "70%" }}>Net Total: </div>
                  <div style={{ fontSize: "12px", margin: "0px", textAlign: "right", width: "30%" }}>{  netTotal.toLocaleString() } </div>
                  {
                    Number(sale.cashPaid) !== 0 ?
                    <>
                      <div style={{ fontSize: "12px", margin: "0px", textAlign: "right", fontWeight: "bold", width: "70%" }}>Cash Paid: </div>
                      <div style={{ fontSize: "12px", margin: "0px", textAlign: "right", width: "30%" }}>{  (+Number(sale.cashPaid).toFixed(2)).toLocaleString() } </div>
                    </> : null
                  }
                  {
                    Number(sale.bankAmount) !== 0 ?
                    <>
                      <div style={{ fontSize: "12px", margin: "0px", textAlign: "right", fontWeight: "bold", width: "70%" }}>Bank({ banks[sale.bankId] ? banks[sale.bankId].name : null  }) Payment: </div>
                      <div style={{ fontSize: "12px", margin: "0px", textAlign: "right", width: "30%" }}>{  (+Number(sale.bankAmount).toFixed(2)).toLocaleString() } </div>
                    </> : null
                  }
                  {
                    Number(sale.bankAmount) !== 0 && sale.chequeTxnId ?
                    <>
                      <div style={{ fontSize: "12px", margin: "0px", textAlign: "right", fontWeight: "bold", width: "70%" }}> Cheque/Txn ID: </div>
                      <div style={{ fontSize: "12px", margin: "0px", textAlign: "right", width: "30%" }}>{  sale.chequeTxnId } </div>
                    </> : null
                  }
                  {
                    Number(sale.creditAmount) !== 0 ?
                    <>
                      <div style={{ fontSize: "12px", margin: "0px", textAlign: "right", fontWeight: "bold", width: "70%" }}>Credit Amount: </div>
                      <div style={{ fontSize: "12px", margin: "0px", textAlign: "right", width: "30%" }}>{  (+Number(sale.creditAmount).toFixed(2)).toLocaleString() } </div>
                    </> : null
                  }
                  {
                    customer && customer.allowCredit && store.receiptSettings.printCustomerLedger ? 
                    <>
                      <div style={{ fontSize: "12px", margin: "0px", textAlign: "right", fontWeight: "bold", width: "70%" }}>Previous Balance: </div>
                      <div style={{ fontSize: "12px", margin: "0px", textAlign: "right", width: "30%" }}>{  (+(customer.currentBalance - Number(sale.creditAmount)).toFixed(2)).toLocaleString() } </div>

                      <div style={{ fontSize: "12px", margin: "0px", textAlign: "right", fontWeight: "bold", width: "70%" }}>New Balance: </div>
                      <div style={{ fontSize: "12px", margin: "0px", textAlign: "right", width: "30%" }}>{  (+Number(customer.currentBalance).toFixed(2)).toLocaleString() } </div>
                    </> : null
                  }
                  {
                    totalPayment - netTotal > 0 ?
                    <>
                      <div style={{ fontSize: "12px", margin: "0px", textAlign: "right", fontWeight: "bold", width: "70%" }}>Cash returned: </div>
                      <div style={{ fontSize: "12px", margin: "0px", textAlign: "right", width: "30%" }}>{  (+(totalPayment - netTotal).toFixed(2)).toLocaleString() } </div>
                    </> : null
                  }
                </div>
              </Box>
              {
                 store.receiptSettings.footer ?
                  <Box style={{ fontSize: 12, padding: "0px 8px", textAlign: "center",  }} >
                    { store.receiptSettings.footer }
                  </Box> : null
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

export default PrintSale;