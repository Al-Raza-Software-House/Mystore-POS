import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Dialog, Typography, DialogActions, Button, DialogContent, Box } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import moment from 'moment';

const cellStyle = { border: '1px solid black', textAlign: "center", borderSpacing: "0px", padding: "3px 10px", boxSizing: "border-box" };

function PrintRtv(props){
  const { rtv, setRtv } = props;
  const [open, setOpen] = useState(false);
  const handleClose = () => {
    setOpen(false);
    setRtv(false);
  };
  const store = useSelector(state => {
    let storeId = state.stores.selectedStoreId;
    return state.stores.stores.find(record => record._id === storeId);
  });

  const items = useSelector(state => {
    let storeId = state.stores.selectedStoreId;
    return state.items[storeId].allItems? state.items[storeId].allItems : [];
  });
  
  const itemMaps = useMemo(() => {
    let newMap = {};
    if(!rtv) return newMap;
    rtv.items.forEach(record => {
      let item = items.find(item => item._id === record._id);
      if(item)
        newMap[item._id] = item;
    });
    return newMap;
  }, [items, rtv]);
  const printReceipt = useCallback(() => {
    var mywindow = window.open('', 'PRINT', 'height=600,width=800');
      mywindow.document.write('<html><head><title>Return to Vendor</title>');
      mywindow.document.write('</head><body >');
      mywindow.document.write('<style type="text/css"> body{ margin: 0px }  @media print { #table-container{ margin-bottom: 40mm; } }  </style>')
      mywindow.document.write('<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />');
      mywindow.document.write(document.getElementById("receipt-container").innerHTML);
      mywindow.document.write('</body></html>');

      mywindow.document.close(); // necessary for IE >= 10
      mywindow.focus(); // necessary for IE >= 10*/

     setTimeout(() => {
        mywindow.print();
        mywindow.close();
     }, 500)

      return true;
  }, []);

  const totalQuantity = useMemo(() => {
    if(!rtv) return 0;
    let total = 0;
    rtv.items.forEach(item => {
      if(isNaN(item.quantity))
        total += 0
      else
        total += Number(item.quantity);
    });
    return (+total.toFixed(2)).toLocaleString()
  }, [rtv]);


  const totalAmount = useMemo(() => {
    if(!rtv) return 0;
    let total = 0;
    rtv.items.forEach(item => {
      let costPrice = item.costPrice;
      let quantity = item.quantity;
      let adjustment = item.adjustment * quantity;
      let tax = item.tax * quantity;
      total += costPrice * quantity;
      total += tax;
      total -= adjustment;
    });
    return (+total.toFixed(2)).toLocaleString()

  }, [rtv]);

  useEffect(() => {
    if(rtv)
      setOpen(true);
    else
      setOpen(false);
  }, [rtv])

  return(
    <Dialog open={open} fullWidth maxWidth="xs" onClose={handleClose} aria-labelledby="form-dialog-title">
      {
        !rtv ?  null :
        <DialogContent>
          <Box id="receipt-container" style={{ backgroundColor: '#ececec' }} maxWidth="80mm" margin="auto">
            <Box style={{ fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', maxWidth: "80mm" }} py={2}>
              <Typography style={{ marginTop: "0px", marginBottom: "0px", fontSize: 20, textAlign: "center" }}>Return to Vendor</Typography>
              <Typography style={{ marginTop: "0px", marginBottom: "0px", fontSize: 18, textAlign: "center" }}>{ store.name }</Typography>
              <Typography style={{ marginTop: "0px", marginBottom: "0px", fontSize: 12, textAlign: "center" }}>{ store.address }</Typography>
              <Typography style={{ marginTop: "0px", marginBottom: "8px", fontSize: 12, textAlign: "center" }}>{ store.phone1 }</Typography>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0px 15px", textAlign: "center" }}>
                <Typography style={{ fontSize: "12px", fontWeight: "bold", margin: "0px" }}>RTV #:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px" }}>{ rtv.rtvNumber }</Typography>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0px 15px" }}>
                <Typography style={{ fontSize: "12px", fontWeight: "bold", margin: "0px" }}>Date:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px" }}>{ moment(rtv.rtvDate).format("DD MMM, YYYY") }</Typography>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0px 15px" }}>
                <Typography style={{ fontSize: "12px", fontWeight: "bold", margin: "0px" }}>Supplier:</Typography>
                <Typography style={{ fontSize: "12px", margin: "0px" }}>{ rtv.supplier.name }</Typography>
              </div>
              { 
                rtv.notes ?
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0px 15px" }}>
                  <Typography style={{ fontSize: "12px", fontWeight: "bold", margin: "0px" }}>Notes:</Typography>
                  <Typography style={{ fontSize: "12px", margin: "0px" }}>{ rtv.notes }</Typography>
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
                      rtv.items.map(item => (
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
                      <td style={cellStyle}>{ totalQuantity }</td>
                      <td style={cellStyle}>{ totalAmount }</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ display: "flex", justifyContent: "space-between", margin: "10px 15px", }}>
                  <Typography style={{ fontSize: "12px", margin: "0px", textAlign: "left" }}>Total Items: <b>{ rtv.items.length } </b></Typography>
                  <Typography style={{ fontSize: "12px", margin: "0px", textAlign: "center" }}>Total Amount: <b>{ totalAmount } </b></Typography>
                </div>
              </Box>
              <div style={{ visibility: "hidden" }}>.</div>
              <Box style={{ display: "flex", justifyContent: "space-between", padding: "0px 8px", marginBottom: "16px", marginTop: "10px" }} >
                <Box style={{ borderTop: "1px solid black", textAlign: "center", width: "45%", paddingTop: "8px", fontSize: '12px' }} > Prepared By </Box>
                <Box style={{ borderTop: "1px solid black", textAlign: "center", width: "45%", paddingTop: "8px", fontSize: '12px' }}> Purchase Manager </Box>
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

export default PrintRtv;