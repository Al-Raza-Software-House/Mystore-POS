import React, { useEffect, useRef } from 'react'
import { Box, Chip, IconButton, InputAdornment, Typography, useMediaQuery, Popover } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen, faCheck, faLayerGroup, faMinus, faPlus, faTimes, faCircleNotch, } from '@fortawesome/free-solid-svg-icons';
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
import QuantityField from 'components/library/form/QuantityField';

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
      <Box display="flex" justifyContent="space-between" borderBottom="1px solid #ececec">
        <Box width={{ xs: "100%", md: "48%" }} >
          <Box height="53px" display="flex" justifyContent="space-between"  flexWrap="wrap" alignItems="center" px={2} py={0} >
            <Typography>Items: <Chip size="small" component="span" label={ totals.totalItems } /> </Typography>
            <Typography>Qty: <Chip size="small" component="span" label={ totals.totalQuantity } /></Typography>
            <Typography>Total: <Chip size="small" component="span" label={ totals.totalAmount } /></Typography>
            <Typography>Discount: <Chip size="small" component="span" label={ totals.totalDiscount } /></Typography>
          </Box>
        </Box>
        <Box width={{ xs: "100%", md: "48%" }} >
          <Field
              component={TextInput}
              name="notes"
              label="Notes"
              placeholder="Notes..."
              type="text"
              fullWidth={true}
              variant="outlined"
              margin="dense"
              disabled={disabled}
              showError={false}
            />
        </Box>
      </Box>
      <Box width="100%" id="cart-container"  borderRadius={5} style={{ boxSizing: "border-box", overflowY: "auto", height: "calc(100vh - 298px)" }} display="flex" justifyContent="space-between" flexWrap="wrap" alignItems="flex-start" alignContent="flex-start">
        {
          items.length === 0 ? null : items.map(item => (
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
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const formItem = useSelector(state => formValueSelector(formName)(state, `items[${item._id}]`));
  const toggleVoid = useCallback(() => {
    dispatch( change(formName, `items[${item._id}].isVoided`, !Boolean(formItem.isVoided)) )
  }, [dispatch, item._id, formItem.isVoided, formName])

  const [showFields, setShowFields] = useState(false);
  const renderTimer = useRef();
  useEffect(() => {
    renderTimer.current = setTimeout(() => setShowFields(true), 5);
    return () => renderTimer.current && clearTimeout(renderTimer.current);
  }, [])

  if(!formItem) return null;

  let quantity = isNaN(formItem.quantity) ? 0 : Number(formItem.quantity);
  let salePrice = isNaN(formItem.salePrice) ? 0 : Number(formItem.salePrice);
  let discount = isNaN(formItem.discount) ? 0 : Number(formItem.discount);
  let originalPrice = Number(item.packParentId ? item.packSalePrice : item.salePrice);
  

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return(
    <Box width="100%" borderBottom="2px solid #c3c2c2" minHeight="52px" display="flex" justifyContent="start" alignItems="center">
      <Box  display="flex" justifyContent="start" alignItems="center" px={2} width="100%">

          <Box style={{ textDecoration: formItem.isVoided ? "line-through" : "none" }} flexGrow={1} mr={1}>
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
                { salePrice !== originalPrice ?  <span style={{ color: "red" }}>&nbsp;&nbsp;&nbsp;{ salePrice.toLocaleString('en-US') }</span> : null }
              </Typography>
            </Box>
          </Box>
          <Box width="171px" style={{ textDecoration: formItem.isVoided ? "line-through" : "none" }} >
            <QuantityInput itemId={item._id} disabled={disabled} allowNegativeInventory={allowNegativeInventory} formName={formName} isDesktop={isDesktop} />
          </Box>
          <Box style={{ textDecoration: formItem.isVoided ? "line-through" : "none" }} width="75px" >
            <Typography style={{ fontSize: 16, fontWeight: "bold", color: discount !== 0 ? "green" : "#0d0d0d" }} align="center">
              { (+((quantity * salePrice) - (quantity * discount)).toFixed(2)).toLocaleString() }
            </Typography>
            
          </Box>
          {
            !showFields ? 
            <Box width="486px" display="flex" justifyContent="center" alignItems="center" height="52px" style={{ color: '#6c6a6a' }}>
              <FontAwesomeIcon icon={faCircleNotch} spin={true} size="lg" />
            </Box> 
            :
            <>
              <Box px={1} width="100px" style={{ textDecoration: formItem.isVoided ? "line-through" : "none" }} >
                <Field
                  component={TextInput}
                  label="Sale Price"
                  name={`items[${item._id}].salePrice`}
                  placeholder="Price..."
                  fullWidth={true}
                  variant="outlined"
                  margin="dense"
                  type="text"
                  showError={false}
                  onKeyDown={allowOnlyNumber}
                  disabled={disabled}
                />
              </Box>
              <Box  width="280px" style={{ textDecoration: formItem.isVoided ? "line-through" : "none" }} >
                <DiscountInput itemId={item._id} disabled={disabled} formName={formName} />
              </Box>
              
              
              <Box width="90px" textAlign="center" display="flex" justifyContent="end">
                {
                  item.sizeName ? null :
                  <IconButton onClick={(event) => handleClick(event) }>
                    <FontAwesomeIcon icon={ faLayerGroup } size="sm" />
                  </IconButton>
                }
                <IconButton disabled={disabled} variant={ formItem.isVoided ? "outlined" : "contained" } title={formItem.isVoided ? "Add item to bill" : "Remove item form bill"} color="primary" onClick={toggleVoid}>
                  <FontAwesomeIcon icon={ formItem.isVoided ? faCheck : faTimes} />
                </IconButton>
              </Box>
            </>
          }
        </Box>
      {
        !showFields ? null : 
        <Popover 
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          >
          { 
            !open ? null : 
            <>
              <Box px={2} py={2} minWidth="450px" style={{ backgroundColor: '#f9f9f9' }}>
                <Typography variant="h6" gutterBottom align="center">{ item.itemName }</Typography>
                <Typography style={{ color: "#6c6a6a" }} gutterBottom align="center">Total Quantity: { Math.abs(quantity).toLocaleString() }</Typography>
                <Box >
                { 
                  quantity > 0 ? <FieldArray name={`items[${item._id}].batches`} component={SaleBatches} {...{batches: item.batches}} disabled={disabled} />  : 
                  (quantity < 0 ? <FieldArray name={`items[${item._id}].batches`} component={ReturnBatches} disabled={disabled} /> : null)
                }
                </Box>
              </Box> 
            </>
          }
        </Popover>
      }
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
      component={QuantityField}
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
  {id: 1, title: '% Disc'},
  {id: 2, title: 'Rs. Disc'}
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
      <Box pt={1} width="105px">
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
      <Box width="75px">
        <Field
          component={TextInput}
          label="Disc"
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
      <Box width="75px">
        <Field
          component={TextInput}
          label="Disc (Rs)"
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