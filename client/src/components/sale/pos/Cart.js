import React, { useEffect } from 'react'
import { Box, Button, Chip, Collapse, IconButton, InputAdornment, Typography } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen, faChevronDown, faChevronUp, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useMemo } from 'react';
import { allowOnlyNumber } from 'utils';
import { change, Field, FieldArray } from 'redux-form';
import TextInput from 'components/library/form/TextInput';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useState } from 'react';
import SaleBatches from './SaleBatches';

function Cart({ formItems, items, formName }){
  const totals = useMemo(() => {
    let totalQuantity = 0;
    let totalAmount = 0;
    let totalDiscount = 0;
    items.forEach(record => {
      let item = formItems[record._id];
      if(!item || item.isVoided) return;
      let quantity = isNaN(item.quantity) ? 0 :  Number(item.quantity);
      totalQuantity += quantity;

      let salePrice = isNaN(item.salePrice) ? 0 :  Number(item.salePrice);

      let discount = isNaN(item.discount) ? 0 :  quantity * Number(item.discount);
      totalDiscount += discount;
      totalAmount += salePrice * quantity;
      totalAmount -= discount;
    });
    return {
      totalItems: items.length,
      totalQuantity: (+totalQuantity.toFixed(2)).toLocaleString(),
      totalAmount: (+totalAmount.toFixed(2)).toLocaleString(),
      totalDiscount: (+totalDiscount.toFixed(2)).toLocaleString(),
    }
  }, [formItems, items]);

  useEffect(() => {
    let container = document.getElementById("cart-container");
    container.scrollTop = container.scrollHeight;
  }, [items.length]);
  return(
    <>
    <Box  border="1px solid #ececec" borderRadius={5}>
      <Box height="53px" display="flex" justifyContent="space-between" borderBottom="1px solid #ececec" flexWrap="wrap" alignItems="center" px={2} py={0} >
        <Typography>Items: <Chip size="small" component="span" label={ totals.totalItems } /> </Typography>
        <Typography>Qty: <Chip size="small" component="span" label={ totals.totalQuantity } /></Typography>
        <Typography>Total: <Chip size="small" component="span" label={ totals.totalAmount } /></Typography>
        <Typography>Discount: <Chip size="small" component="span" label={ totals.totalDiscount } /></Typography>
      </Box>
      <Box width="100%" height="369px" id="cart-container"  borderRadius={5} style={{ boxSizing: "border-box", overflowY: "auto" }} display="flex" justifyContent="space-between" flexWrap="wrap" alignItems="flex-start" alignContent="flex-start">
        {
          items.map(item => (
            <Item item={item} formItem={formItems[item._id]} key={item._id} formName={formName} />
          ))
        }
      </Box>
    </Box>
    </>
  )
}



function Item({ item, formItem, formName }){
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  let quantity = isNaN(formItem.quantity) ? 0 : Number(formItem.quantity);
  let salePrice = isNaN(formItem.salePrice) ? 0 : Number(formItem.salePrice);
  let discount = isNaN(formItem.discount) ? 0 : Number(formItem.discount);
  let originalPrice = Number(item.packParentId ? item.packSalePrice : item.salePrice);
  const decreaseQuantity = useCallback(() => {
    dispatch( change(formName, `items[${item._id}].quantity`, quantity - 1) );
  }, [quantity, dispatch, item._id, formName]);

  const increaseQuantity = useCallback(() => {
    dispatch( change(formName, `items[${item._id}].quantity`, quantity + 1) );
  }, [quantity, dispatch, item._id, formName]);
  const toggleVoid = useCallback(() => {
    dispatch( change(formName, `items[${item._id}].isVoided`, !Boolean(formItem.isVoided)) )
  }, [dispatch, item._id, formItem.isVoided, formName])

  return(
    <Box width="100%" borderBottom="4px solid #c3c2c2" >
      <Box px={2} pt={1} style={{ textDecoration: formItem.isVoided ? "line-through" : "none" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography style={{ fontSize: 14, fontWeight: "bold" }}>
            {item.itemName}
            { item.packParentId ? <span style={{ color: '#7c7c7c' }} title={`Pack of ${item.packQuantity}`}><FontAwesomeIcon style={{ marginLeft: 8 }} icon={faBoxOpen} /> </span> : null }
          </Typography>
          <Typography style={{ color: '#6c6a6a', fontSize: 13 }}>{item.sizeName} { item.sizeName && item.combinationName ? "|" : ""  } {item.combinationName}</Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography style={{ color: '#6c6a6a', fontSize: 13 }}>{item.itemCode}{item.sizeCode ? '-' : ""}{item.sizeCode}{item.combinationCode ? '-' : ""}{item.combinationCode}</Typography>
          <Typography style={{ color: '#6c6a6a', fontSize: 13 }}>
            Price: <span style={{ textDecoration: salePrice !== originalPrice ? "line-through" : "none" }}>{ originalPrice.toLocaleString('en-US') }</span> 
            { salePrice !== originalPrice ?  <span>&nbsp;&nbsp;&nbsp;{ salePrice.toLocaleString('en-US') }</span> : null }
          </Typography>
        </Box>
      </Box>
      <Box  display="flex" justifyContent="space-between" alignItems="center" px={2}>
        <Box maxWidth="228px" display="flex" justifyContent="space-between" alignItems="center">
          <Box >
            <IconButton onClick={() => setOpen(!open)}>
              <FontAwesomeIcon icon={ !open ? faChevronDown : faChevronUp } size="sm" />
            </IconButton>
          </Box>
          <Box px={1} maxWidth="185px" style={{ textDecoration: formItem.isVoided ? "line-through" : "none" }}>
            <Field
              component={TextInput}
              label="Quantity"
              name={`items[${item._id}].quantity`}
              placeholder="Qty..."
              fullWidth={true}
              variant="outlined"
              margin="dense"
              type="text"
              showError={false}
              onKeyDown={allowOnlyNumber}
              inputProps={{ style: { textAlign: "center" } }}
              InputProps={{
                  startAdornment:
                    <InputAdornment position="start">
                      <IconButton
                        onClick={decreaseQuantity}
                        onMouseDown={(event) => event.preventDefault()}
                      >
                        { <FontAwesomeIcon icon={ faMinus } size="xs" /> }
                      </IconButton>
                    </InputAdornment>,
                  endAdornment:
                    <InputAdornment position="start">
                      <IconButton
                        onClick={increaseQuantity}
                        onMouseDown={(event) => event.preventDefault()}
                      >
                        { <FontAwesomeIcon icon={ faPlus } size="xs" /> }
                      </IconButton>
                    </InputAdornment>
                  }
                }
            />
          </Box>
        </Box>
        
        <Box style={{ textDecoration: formItem.isVoided ? "line-through" : "none" }}>
          <Typography style={{ fontSize: 16, fontWeight: "bold" }}>{ (+((quantity * salePrice) - (quantity * discount)).toFixed(2)).toLocaleString() }</Typography>
        </Box>
        <Box width="90px" textAlign="center">
          <Button type="button" variant={ formItem.isVoided ? "outlined" : "contained" } color="primary" onClick={toggleVoid} > { formItem.isVoided ? "unVoid" : "Void" } </Button>
        </Box>
      </Box>
      <Collapse in={open} style={{ textDecoration: formItem.isVoided ? "line-through" : "none" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box px={1} width={{ xs: "100%", md: "48%" }}>
            <Field
              component={TextInput}
              label="Sale Price"
              name={`items[${item._id}].salePrice`}
              placeholder="Qty..."
              fullWidth={true}
              variant="outlined"
              margin="dense"
              type="text"
              showError={false}
              onKeyDown={allowOnlyNumber}
            />
          </Box>
          <Box px={1} width={{ xs: "100%", md: "48%" }}>
            <Field
              component={TextInput}
              label="Discount"
              name={`items[${item._id}].discount`}
              placeholder="Qty..."
              fullWidth={true}
              variant="outlined"
              margin="dense"
              type="text"
              showError={false}
              onKeyDown={allowOnlyNumber}
            />
          </Box>
        </Box>
        <Box px={1}>
          { 
            item.sizeName ? null :
            <FieldArray name={`items[${item._id}].batches`} component={SaleBatches} {...{batches: item.batches}} />
          }
        </Box>
      </Collapse>
    </Box>
  )
}

export default Cart;