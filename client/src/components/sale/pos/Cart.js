import React, { useEffect } from 'react'
import { Box, Button, Chip, Collapse, IconButton, InputAdornment, Typography, useMediaQuery } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen, faChevronDown, faChevronUp, faMinus, faPercent, faPlus, faTrash, faTrashRestore } from '@fortawesome/free-solid-svg-icons';
import { useMemo } from 'react';
import { allowOnlyNumber, allowOnlyPostiveNumber } from 'utils';
import { change, Field, FieldArray, formValueSelector } from 'redux-form';
import TextInput from 'components/library/form/TextInput';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import SaleBatches from './SaleBatches';
import ReturnBatches from './ReturnBatches';
import SelectInput from 'components/library/form/SelectInput';

function Cart({ formItems, items, formName, allowNegativeInventory, disabled }){
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
    <Box  border="1px solid #ececec" borderRadius={5} flexGrow={1} display="flex" flexDirection="column" >
      <Box height="53px" display="flex" justifyContent="space-between" borderBottom="1px solid #ececec" flexWrap="wrap" alignItems="center" px={2} py={0} >
        <Typography>Items: <Chip size="small" component="span" label={ totals.totalItems } /> </Typography>
        <Typography>Qty: <Chip size="small" component="span" label={ totals.totalQuantity } /></Typography>
        <Typography>Total: <Chip size="small" component="span" label={ totals.totalAmount } /></Typography>
        <Typography>Discount: <Chip size="small" component="span" label={ totals.totalDiscount } /></Typography>
      </Box>
      <Box width="100%" id="cart-container"  borderRadius={5} style={{ boxSizing: "border-box", overflowY: "auto", height: "calc(100vh - 320px)" }} display="flex" justifyContent="space-between" flexWrap="wrap" alignItems="flex-start" alignContent="flex-start">
        {
          items.map(item => (
            <Item item={item} key={item._id} formName={formName} allowNegativeInventory={allowNegativeInventory} disabled={disabled} />
          ))
        }
      </Box>
    </Box>
  )
}



const Item = React.memo(
  ({ item, formName, allowNegativeInventory, disabled }) => {
  const dispatch = useDispatch();
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('sm'), { noSsr: true });
  const [open, setOpen] = useState(false);
  const formItem = useSelector(state => formValueSelector(formName)(state, `items[${item._id}]`));
  let quantity = isNaN(formItem.quantity) ? 0 : Number(formItem.quantity);
  let salePrice = isNaN(formItem.salePrice) ? 0 : Number(formItem.salePrice);
  let discount = isNaN(formItem.discount) ? 0 : Number(formItem.discount);
  let originalPrice = Number(item.packParentId ? item.packSalePrice : item.salePrice);
  
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
            <QuantityInput itemId={item._id} disabled={disabled} allowNegativeInventory={allowNegativeInventory} formName={formName} isDesktop={isDesktop} />
          </Box>
        </Box>
        
        <Box style={{ textDecoration: formItem.isVoided ? "line-through" : "none" }}>
          <Typography style={{ fontSize: 16, fontWeight: "bold" }}>
            { (+((quantity * salePrice) - (quantity * discount)).toFixed(2)).toLocaleString() }
            { discount !== 0 ? <span style={{ color: 'green'}}> &nbsp; &nbsp; <FontAwesomeIcon title="Discount Applied" icon={faPercent}  /> </span>: null }
          </Typography>
          
        </Box>
        <Box width={ isDesktop ?"90px" : "50px" } textAlign="center">
          {
            isDesktop ?
            <Button type="button" disabled={disabled} variant={ formItem.isVoided ? "outlined" : "contained" } color="primary" onClick={toggleVoid} > { formItem.isVoided ? "unVoid" : "Void" } </Button>
            :
            <IconButton disabled={disabled} variant={ formItem.isVoided ? "outlined" : "contained" } color="primary" onClick={toggleVoid}>
              <FontAwesomeIcon icon={ formItem.isVoided ? faTrashRestore : faTrash} />
            </IconButton>

          }
        </Box>
      </Box>
      <Collapse in={open} style={{ textDecoration: formItem.isVoided ? "line-through" : "none" }}>
        { 
          !open ? null : 
          <>
            <Box >
              <Box px={1}>
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
                  disabled={disabled}
                />
              </Box>
            </Box>
            <Box px={1}>
              <DiscountInput itemId={item._id} disabled={disabled} formName={formName} />
            </Box>
            <Box px={1}>
              { 
                item.sizeName ? null :
                (
                  quantity > 0 ? <FieldArray name={`items[${item._id}].batches`} component={SaleBatches} {...{batches: item.batches}} disabled={disabled} />  : 
                  (quantity < 0 ? <FieldArray name={`items[${item._id}].batches`} component={ReturnBatches} disabled={disabled} /> : null)
                  
                )
              }
            </Box> 
          </>
        }
      </Collapse>
    </Box>
  )
}
)

const  QuantityInput = React.memo(
  ({ itemId, allowNegativeInventory, disabled, formName, isDesktop }) => {
  const dispatch = useDispatch();
  const quantity = useSelector(state => formValueSelector(formName)(state, `items[${itemId}].quantity`));
  const decreaseQuantity = useCallback(() => {
    dispatch( change(formName, `items[${itemId}].quantity`, (Number(quantity) ? Number(quantity) : 0)  - 1) );
  }, [quantity, dispatch, itemId, formName]);

  const increaseQuantity = useCallback(() => {
    dispatch( change(formName, `items[${itemId}].quantity`, (Number(quantity) ? Number(quantity) : 0) + 1) );
  }, [quantity, dispatch, itemId, formName]);

  return(
    <Field
      component={TextInput}
      label="Quantity"
      name={`items[${itemId}].quantity`}
      placeholder="Qty..."
      fullWidth={true}
      variant="outlined"
      margin="dense"
      type="text"
      showError={allowNegativeInventory ? false:  true}
      ignoreTouch={allowNegativeInventory ? false:  true}
      onKeyDown={allowOnlyNumber}
      inputProps={{ style: { textAlign: "center" } }}
      disabled={disabled}
      InputProps={!isDesktop ? {}: {
          startAdornment:
            <InputAdornment position="start">
              <IconButton
                onClick={decreaseQuantity}
                onMouseDown={(event) => event.preventDefault()}
                disabled={disabled}
              >
                { <FontAwesomeIcon icon={ faMinus } size="xs" /> }
              </IconButton>
            </InputAdornment>,
          endAdornment:
            <InputAdornment position="start">
              <IconButton
                onClick={increaseQuantity}
                onMouseDown={(event) => event.preventDefault()}
                disabled={disabled}
              >
                { <FontAwesomeIcon icon={ faPlus } size="xs" /> }
              </IconButton>
            </InputAdornment>
          }
        }
    />
  )
  
}
) 

const discountTypes = [
  {id: 1, title: 'Percent Discount'},
  {id: 2, title: 'Rupee Discount'}
]

const DiscountInput = React.memo(
  ({ itemId, disabled, formName }) => {
  const dispatch = useDispatch();
  const salePrice = useSelector(state => formValueSelector(formName)(state, `items[${itemId}].salePrice`));
  const discountType = useSelector(state => formValueSelector(formName)(state, `items[${itemId}].discountType`));
  const discountValue = useSelector(state => formValueSelector(formName)(state, `items[${itemId}].discountValue`));
  useEffect(() => {
    if(parseInt(discountType) === 1) //percent discount
    {
      let percentDiscount = Number(discountValue) / 100;
      dispatch( change(formName, `items[${itemId}].discount`, +Number(salePrice * percentDiscount).toFixed(2)) );
    }else if(parseInt(discountType) === 2)
    {
      dispatch( change(formName, `items[${itemId}].discount`, +Number(discountValue).toFixed(2)) );
    }
  }, [discountType, discountValue, salePrice, dispatch, formName, itemId]);

  return(
    <Box display="flex" justifyContent="space-between">
      <Box pt={1}>
        <Field
          component={SelectInput}
          options={discountTypes}
          name={`items[${itemId}].discountType`}
          fullWidth={true}
          variant="outlined"
          margin="dense"
          type="text"
          showError={false}
          disabled={disabled}
        />
      </Box>
      <Box width="120px">
        <Field
          component={TextInput}
          label="Discount"
          name={`items[${itemId}].discountValue`}
          placeholder="Discount..."
          fullWidth={true}
          variant="outlined"
          margin="dense"
          type="text"
          readOnly={true}
          showError={false}
          onKeyDown={allowOnlyPostiveNumber}
          disabled={disabled}
        />
      </Box>
      <Box width="120px">
        <Field
          component={TextInput}
          label="Discount (Rs)"
          name={`items[${itemId}].discount`}
          placeholder="Discount..."
          fullWidth={true}
          variant="outlined"
          margin="dense"
          type="text"
          readOnly={true}
          showError={false}
          onKeyDown={allowOnlyNumber}
          disabled={true}
        />
      </Box>
    </Box>
  )
  
}
)

export default Cart;