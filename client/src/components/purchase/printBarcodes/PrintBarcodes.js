import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Dialog, DialogActions, Button, DialogContent, Box } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import JsBarcode from 'jsbarcode';


function PrintBarcodes(props){
  const { data, setData, items } = props;
  const [open, setOpen] = useState(false);
  const handleClose = () => {
    setOpen(false);
    setData(false);
  };
  const store = useSelector(state => {
    let storeId = state.stores.selectedStoreId;
    return state.stores.stores.find(record => record._id === storeId);
  });


  const printReceipt = useCallback(() => {
    var mywindow = window.open('', 'PRINT', 'height=600,width=800');
      mywindow.document.write('<html><head><title>Purchase Order</title>');
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

  useEffect(() => {
    if(data)
      setOpen(true);
    else
      setOpen(false);
  }, [data])

  return(
    <Dialog open={open} fullWidth maxWidth="xs" onClose={handleClose} aria-labelledby="form-dialog-title">
      {
        !data ?  null :
        <DialogContent>
          <Box id="receipt-container"  maxWidth="110mm" margin="auto">
            <Box style={{ fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', maxWidth: "110mm", display: "flex", justifyContent: "space-between", flexWrap: "wrap" }} py={2}>
              {
                 items.map(item => {
                   let quantity = data.items[item._id] ? data.items[item._id].quantity : null;
                   if(!quantity) return null;
                   quantity = parseInt(quantity);
                   if(isNaN(quantity)) return null;
                   return [...Array(quantity)].map(index => {
                     return <BarcodeItem item={item} storeName={store.name} key={item._id + index} />
                   })
                 })
              }
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


function BarcodeItem({ item, storeName }){
  const id = useMemo(() => {
    return makeid(9);
  }, []);
  
  useEffect(() => {
    let code = item.itemCode;
    if(item.sizeCode)
      code +=  '-'+item.sizeCode+'-'+item.combinationCode;
    let width = 1.3;
    if(item.sizeCode) // contains 2 dashes
      width = 0.92;
    if(item.packParentId) // contains single dash
      width = 1.1;
    JsBarcode('#'+id, code, { width: width , height: 28, displayValue: false, margin: 0 });
  }, [id, item]);
  return (
    <div style={{ margin: "1.5mm 1mm 0mm 1mm", width: "48mm", height: "23.5mm" }}>
      <div style={{ fontSize: "small", textAlign: "center", margin: "0mm 0mm 1.5mm 0mm", overflow: "hidden", whiteSpace: "nowrap", fontWeight: "bold", width: "auto" }}> 
        <font size="1.5">{storeName}</font>
      </div>
      <div style={{ fontSize: "small", "textAlign": "left", margin: "5px 2px 1px 2px", overflow: "hidden", whiteSpace: "nowrap" }}>
        <span style={{ float: "left", width: "68%", overflow: "hidden", whiteSpace: "nowrap" }}>
          <font size="1.5">
            {item.itemName}
          </font>
        </span>
        <span style={{ width: "30%", float: "right", textAlign: "right", fontWeight: "bold" }} ><font size="1.5">Rs. { item.packParentId ? item.packSalePrice.toLocaleString() : item.salePrice.toLocaleString() }</font></span> 
      </div>
      <div style={{ textAlign: "center" }}>
        <svg id={id} ></svg>
      </div>
      <div style={{ fontSize: "small", "textAlign": "center", overflow: "hidden", whiteSpace: "nowrap" }}>
          <font size="1.5">{item.itemCode}{item.sizeCode ? '-'+item.sizeCode+'-'+item.combinationCode : '' }</font>
      </div>
    </div>
  )
}

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

export default PrintBarcodes;