import React, { useMemo, useRef } from 'react'
import { Box, Button, IconButton, InputAdornment, Typography } from '@material-ui/core';
import ItemPicker from '../../library/ItemPicker';
import { useState } from 'react';
import { useCallback } from 'react';
import { change, Field, formValueSelector, getFormValues, initialize, reduxForm } from 'redux-form';
import { allowOnlyNumber } from '../../../utils';
import TextInput from '../../library/form/TextInput';
import DateTimeInput from '../../library/form/DateTimeInput';
import moment from 'moment';
import { useEffect } from 'react';
import { compose } from 'redux';
import { connect, useSelector } from 'react-redux';
import SelectCustomer from './SelectCustomer';
import ItemsGrid from './ItemsGrid';
import Cart from './Cart';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faMoneyBillWaveAlt, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { showSuccess } from 'store/actions/alertActions';
import { addNewSale } from 'store/actions/saleActions';
import Payment from './Payment';
import { hideProgressBar, showProgressBar } from 'store/actions/progressActions';

const formName = "saleAndReturn";

function SaleAndReturn(props){
  const { storeId, lastEndOfDay, dispatch, defaultBankId, pristine, submitting, invalid, dirty, handleSubmit, banks } = props;
  const refreshTimeInterval = useRef();
  const [items, setItems] = useState([]);
  const resetSale = useCallback(() => {
    setItems([]);
    dispatch(initialize(formName, {
      saleDate: moment().toDate(),
      quantity: 1,
      adjustment: 0,
      cashPaid: 0,
      bankAmount: 0,
      creditAmount: 0,
      bankId: defaultBankId,
      items: {}
    }
    ));
  }, [dispatch, defaultBankId]);

  useEffect(() => {
    resetSale();
  }, [resetSale]);

  const formValues = useSelector(state => {
    let formData = getFormValues(formName)(state);
    if(formData)
      return !formData.items ? { ...formData, items: []} : formData;
    else
      return { items: [] }
  });

  useEffect(() => {
    if(!pristine && refreshTimeInterval.current)
    {
      clearInterval(refreshTimeInterval.current);
      return;
    }
    if(!pristine) return;
    if(formValues._id) return; //Don't update time in edit mode
    refreshTimeInterval.current = setInterval(resetSale, 1000 * 60)
    return () => {
      if(refreshTimeInterval.current)
        clearInterval(refreshTimeInterval.current);
    }
  }, [formValues._id, pristine, dispatch, resetSale]);

  const formItems = formValues.items;

  const adjustment = useSelector(state => formValueSelector(formName)(state, 'adjustment'));
  const toggleAdjustment = useCallback(() => {
    if(Number(adjustment) === 0) return;
    dispatch( change(formName, `adjustment`, -1 * Number(adjustment) ) );
  }, [adjustment, dispatch]);
  
  //pass to item Picker
  const selectItem = useCallback((item) => {
    let isExist = items.find(record => record._id === item._id);
    if(isExist)
    {
      dispatch( change(formName, `items[${item._id}].quantity`, Number(formItems[item._id].quantity) + 1));
    }else
    {
      let { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, salePrice, packParentId, packQuantity, packSalePrice, batches } = item;
      let newItem = { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, salePrice, packParentId, packQuantity, packSalePrice, quantity: 1, batches };
      dispatch( change(formName, `items[${_id}]`, {_id, quantity: 1, salePrice: packParentId ? packSalePrice : salePrice, discount: 0, isVoided: false, batches:[{ batchNumber: 0, batchQuantity: 0 }] }));
      setItems([
        ...items,
        newItem,
      ]);
    }
  }, [items, formItems, dispatch]);

  //Pass to item Picker, or delete item from list
  const removeItem = useCallback((item) => {
    dispatch( change(formName, `items[${item._id}]`, ""));
    setItems(prevItems => prevItems.filter(record => record._id !== item._id));
  }, [dispatch]);

  const totalAmount = useMemo(() => {
    let totalAmount = 0;
    items.forEach(record => {
      let item = formItems[record._id];
      if(!item || item.isVoided) return;
      let quantity = isNaN(item.quantity) ? 0 :  Number(item.quantity);

      let salePrice = isNaN(item.salePrice) ? 0 :  Number(item.salePrice);

      let discount = isNaN(item.discount) ? 0 :  quantity * Number(item.discount);
      totalAmount += salePrice * quantity;
      totalAmount -= discount;
    });
    totalAmount = totalAmount + ( isNaN(adjustment) ? 0 :  Number(adjustment) );
    return +totalAmount.toFixed(2);
  }, [formItems, items, adjustment]);

  const totalQuantity = useMemo(() => {
    let total = 0;
    for(let key in formItems)
    {
      let item = formItems[key];
      if(!item) continue;
      if(isNaN(item.quantity))
        total += 0
      else
        total += Number(item.quantity);
    }
    return (+total.toFixed(2)).toLocaleString()
  }, [formItems]);

  const onSubmit = useCallback((formData, dispatch, { storeId, itemsLastUpdatedOn }) => {
    const payload = {storeId, ...formData};
    payload.saleDate = moment(formData.saleDate, "DD MMMM, YYYY hh:mm A").toDate();
    payload.creationDate = moment().toDate();
    payload.lastUpdated = moment().toDate();
    payload.isSynced = false;
    payload.items = [];
    items.forEach(item => {
      let record = formData.items[item._id];
      if(!record) return;
      let {_id, quantity, salePrice, discount, isVoided, batches } = record;
      payload.items.push({_id, quantity, salePrice, discount, isVoided, batches });
    });
    dispatch( addNewSale(storeId, payload) );
    dispatch( showProgressBar() );
    setTimeout(() => {
      dispatch( hideProgressBar() );
      dispatch( showSuccess("New sale added") );
      resetSale();
    }, 500);
  }, [items, resetSale]);
  let submitForm = useCallback(handleSubmit(onSubmit), [handleSubmit, onSubmit]);

  return(
    <form onSubmit={submitForm}>
      <Box display="flex" justifyContent="space-between" alignItems="center" borderBottom="2px solid #ececec" pb={1} mb={1}>
        <Box width={{ xs: '100%', md: '48%' }}>
          <Field
          component={DateTimeInput}
          name="saleDate"
          label="Date"
          dateFormat="DD MMMM, YYYY hh:mm A"
          placeholder="Date..."
          fullWidth={true}
          inputVariant="outlined"
          margin="dense"
          emptyLabel=""
          minDate={ moment(lastEndOfDay).toDate() }
          maxDate={ moment().toDate() }
          showTodayButton
          
          />    
        </Box>
        <Box width={{ xs: '100%', md: '48%' }}>
          <Field
            component={SelectCustomer}
            formName={formName}
            name="customerId"
          />
        </Box>
      </Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box width={{ xs: "100%", md: "48%" }}>
          <Box style={{ backgroundColor: "#f9f9f9" }} border="1px solid #ececec" borderRadius={5}>
            <Box  style={{ backgroundColor: "#fff" }} display="flex" justifyContent="space-between" borderBottom="1px solid #ececec" flexWrap="wrap" alignItems="center" px={2} py={0} >
              <Box style={{ width: '70px' }}>
                <Field
                  component={TextInput}
                  label="Qty"
                  name="quantity"
                  placeholder="Qty..."
                  fullWidth={true}
                  variant="outlined"
                  margin="dense"
                  type="text"
                  showError={false}
                  onKeyDown={allowOnlyNumber}
                  addNewRecord={true}
                />
              </Box>
              <Box style={{ flexGrow: 1 }}>
                <ItemPicker {...{selectItem, removeItem, selectedItems: items, showServiceItems: true, autoFocus: true}} />
              </Box>
            </Box>
            <ItemsGrid selectItem={selectItem} />
          </Box>
          <Box>
            <Field
              component={TextInput}
              name="notes"
              label="Notes"
              placeholder="Notes..."
              type="text"
              fullWidth={true}
              variant="outlined"
              multiline
              rows={2}
              margin="dense"
            />
          </Box>
        </Box>
        <Box width={{ xs: "100%", md: "48%" }}>

          <Cart items={items} formItems={formItems} formName={formName} />
          
          <Box display="flex" justifyContent="space-between">
            <Box width={{xs: "100%", md: "45%"}}>
              <Field
                component={TextInput}
                label="Adjustment"
                name="adjustment"
                fullWidth={true}
                variant="outlined"
                margin="dense"
                type="text"
                showError={false}
                onKeyDown={allowOnlyNumber}
                addNewRecord={true}
                inputProps={{ style:{ textAlign: "right" } }}
                InputProps={{
                    startAdornment:
                      <InputAdornment position="start">
                        <IconButton
                          onClick={() => toggleAdjustment()}
                          onMouseDown={(event) => event.preventDefault()}
                        >
                          { <FontAwesomeIcon icon={ Number(adjustment) <= 0  ? faPlus : faMinus } size="xs" /> }
                        </IconButton>
                      </InputAdornment>
                    }
                  }
              />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Total</Typography>
                <Typography variant="h4">{totalAmount.toLocaleString()}</Typography>
              </Box>
            </Box>
            <Box width={{xs: "100%", md: "53%"}} >
              <Box display="flex" justifyContent="space-between" flexWrap="wrap" pt={1}>
                <Payment {...{ pristine, submitting, invalid, dirty, totalQuantity, totalAmount, formName, banks, storeId, submitForm }} />
                <Button variant="outlined" color="primary" disabled={pristine || submitting || invalid || !dirty || Number(totalQuantity) === 0} type="submit" startIcon={<FontAwesomeIcon icon={faMoneyBillWaveAlt} />} >Cash</Button>
              </Box>
              <Box display="flex" justifyContent="flex-end" flexWrap="wrap" pt={1}>
                <Button variant="contained" color="primary" type="button" disabled={items.length === 0}  startIcon={<FontAwesomeIcon icon={faTimes} />} onClick={resetSale}>Cancel</Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </form>
  )
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  const store = state.stores.stores.find(store => store._id === storeId);
  const banks = state.accounts.banks[storeId] ? state.accounts.banks[storeId] : [];
  const defaultBank = banks.find(bank => bank.default === true);
  const itemsLastUpdatedOn = state.system.lastUpdatedStamps[storeId] ? state.system.lastUpdatedStamps[storeId].items : null;
  return{
    storeId,
    banks: banks.map(bank => ({ id: bank._id, title: bank.name }) ),
    defaultBankId: defaultBank ? defaultBank._id : null,
    lastEndOfDay: store.lastEndOfDay,
    itemsLastUpdatedOn
  }
}

const validate = (values, props) => {
  const { dirty, lastEndOfDay } = props;
  if(!dirty) return {};
  const errors = { items: {} };

  if(lastEndOfDay && moment(values.saleDate, "DD MMMM, YYYY hh:mm A") <= moment(lastEndOfDay))
    errors.saleDate = "Date & time should be after last day closing: " + moment(lastEndOfDay).format("DD MMMM, YYYY hh:mm A");
  else if(moment(values.saleDate, "DD MMMM, YYYY hh:mm A") > moment())
    errors.saleDate = "Date & time should not be after current time: " + moment().format("DD MMMM, YYYY hh:mm A");
  for(let itemId in values.items)
  {
    if(values.items[itemId] === undefined) continue;
    errors.items[itemId] = { batches: {} };
    let quantity = Number(values.items[itemId].quantity);
    if( !quantity ) continue;
    
    let totalQuantity = values.items[itemId].packParentId ? Number(values.items[itemId].packQuantity) * quantity : quantity;
    
    if(totalQuantity > Number(values.items[itemId].currentStock))
      errors.items[itemId].quantity = `return quantity(${totalQuantity}) should not be greater than available stock(${Number(values.items[itemId].currentStock)})`;

    let batchQuantity = 0;
    let batchCount = 0;
    values.items[itemId].batches.forEach((batch, index) => {
      if(!batch.batchNumber) return;
      if(!Number(batch.batchQuantity)) errors.items[itemId].batches._error = "Batch quantity is required";
      batchCount++;
      batchQuantity += Number(batch.batchQuantity);
    });
    if(batchCount && batchQuantity !== Math.abs(quantity) && !errors.items[itemId].batches._error) //batches applied but quantity doesn't match
      errors.items[itemId].batches._error = "Sum of batch quantities should be equal to total quantity";
  }
  return errors;
}

export default compose(
  connect(mapStateToProps),
  reduxForm({
    form: formName,
    validate
  })
)(SaleAndReturn);