import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { makeStyles, Button, Box, Typography, FormHelperText, TableContainer, Table, TableHead, TableBody, TableRow, TableCell } from '@material-ui/core'
import { change, Field, getFormValues, initialize, reduxForm, SubmissionError } from 'redux-form';
import axios from 'axios';
import TextInput from '../../library/form/TextInput';
import { showProgressBar, hideProgressBar } from '../../../store/actions/progressActions';
import { connect } from 'react-redux';
import { showError, showSuccess } from '../../../store/actions/alertActions';
import { compose } from 'redux';
import { useHistory } from 'react-router-dom';
import SelectSupplier from '../../stock/items/itemForm/SelectSupplier';
import DateInput from '../../library/form/DateInput';
import { useSelector } from 'react-redux';
import ItemPicker from '../../library/ItemPicker';
import moment from 'moment';
import CheckboxInput from '../../library/form/CheckboxInput';
import DateTimeInput from '../../library/form/DateTimeInput';
import SelectInput from '../../library/form/SelectInput';
import { payOrCreditOptions, paymentModes } from '../../../utils/constants';
import RadioInput from '../../library/form/RadioInput';
import { allowOnlyPostiveNumber } from '../../../utils';
import GrnItemRow from './GrnItemRow';
import UploadFile from '../../library/UploadFile';
import { addNewGrn } from '../../../store/actions/grnActions';
import { updateSupplier } from '../../../store/actions/supplierActions';
import { addNewTxns } from '../../../store/actions/accountActions';
import { closePurchaseOrder } from '../../../store/actions/purchaseOrderActions';
import { itemsStampChanged, syncItems } from '../../../store/actions/itemActions';
import ReactGA from "react-ga4";

const payNowOrCreditOptions = [
  { id: payOrCreditOptions.PAY_NOW, title: "Pay Now" },
  { id: payOrCreditOptions.ON_CREDIT, title: "Credit" },
];

const paymentModeOptions = [
  { id: paymentModes.PAYMENT_MODE_CASH, title: "Cash" },
  { id: paymentModes.PAYMENT_MODE_BANK, title: "Bank" },
]

const batchDateFormat = "DD-MM-YYYY";

const useStyles = makeStyles(theme => ({
  box: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 'auto'
  },
  progress: {
    marginLeft: theme.spacing(1)
  },
  formError: {
    textAlign: "center"
  }
}));

const formName = "createGrn";

function CreateGrn(props) {
  const history = useHistory();
  const classes = useStyles();
  const { dispatch, storeId, banks, lastEndOfDay, defaultBankId, handleSubmit, pristine, submitSucceeded, submitting, error, invalid, dirty, printGrn} = props;
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/purchase/grns/new", 'title' : "New GRN" });
  }, []);

  const formValues = useSelector(state => {
    let formData = getFormValues(formName)(state);
    if(formData)
      return !formData.items ? { ...formData, items: []} : formData;
    else
      return { items: [] }
  });
  const { supplierId, poId } = formValues;
  const values = formValues.items;
  const supplier = useSelector(state => state.suppliers[storeId] ? state.suppliers[storeId].find(record => record._id === supplierId) : null);
  const allItems = useSelector(state => state.items[storeId].allItems );
  
  const [items, setItems] = useState([]);//selected items
  const [purchaseOrders, setPurchaseOrders] = useState([]); //

  useEffect(() => {
    if(!supplierId)
    {
      dispatch( change(formName, 'poId', 0) )
      setPurchaseOrders(prevOrders => prevOrders.length ? [] : prevOrders);
      return;
    }
    dispatch( showProgressBar() );
    const controller = new AbortController();
    axios.get('/api/purchaseOrders/open', { signal: controller.signal, params: { storeId, supplierId } }).then(({ data }) => {
    dispatch( hideProgressBar() );

      setPurchaseOrders(data.orders);
      dispatch( change(formName, 'poId', 0) )
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    });

    return () => controller.abort()
  }, [supplierId, storeId, dispatch]);

  const poOptions = useMemo(() => {
    let orders = [{ id: 0, title: supplierId && purchaseOrders.length === 0 ? "No purchase orders found, add item manually" : "Select a purchase order or add item manually" }];
    if(!supplierId || purchaseOrders.length === 0) return orders;
    orders = [...orders, ...purchaseOrders.map(order => ({ id: order._id, title: `PO# ${order.poNumber} - ${ moment(order.issueDate).format("DD MMMM") }` }))];
    return orders;
  }, [purchaseOrders, supplierId])

  const renderTimer = useRef();
  const lastPo = useRef();

  useEffect(() => {
    if(typeof lastPo.current !== 'undefined' && lastPo.current === poId) return;//Poid not changed, allitems changed by other device
    lastPo.current = poId;
    setItems([]);
    dispatch(change(formName, 'items', undefined));
    if(!poId) return;
    let order = purchaseOrders.find(record => record._id === poId);
    if(!order) return;
    let newItems = [];
    for(let index = 0; index< order.items.length; index++)
    {
      let record = order.items[index];
      let item = allItems.find(elem => elem._id === record._id);
      if(!item) continue;
      let { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, costPrice, salePrice, currentStock, packParentId, packQuantity, packSalePrice } = item;
      let lowStock = item.currentStock < item.minStock;
      let overStock = item.currentStock > item.maxStock
      if(item.packParentId)
      {
        let parentItem = allItems.find(record => record._id === item.packParentId);
        if(parentItem)
        {
          currentStock = parentItem.currentStock; 
          lowStock = parentItem.currentStock < parentItem.minStock;
          overStock = parentItem.currentStock > parentItem.maxStock
        }
        costPrice = (item.packQuantity * costPrice).toFixed(2);
      }
      let newItem = { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, costPrice, salePrice, currentStock, packParentId, packQuantity, packSalePrice, lowStock, overStock, quantity: 1 };
      dispatch( change(formName, `items[${_id}]`, {_id, costPrice: record.costPrice, salePrice, packSalePrice, quantity: record.quantity, adjustment: 0, tax: 0, notes: "", batches:[{ batchNumber: "", batchExpiryDate: null, batchQuantity: 0 }] }));
      newItems.push(newItem);
    }
    renderTimer.current = setTimeout(() => setItems(newItems), 20);
    return () => renderTimer.current && clearTimeout(renderTimer.current);
  }, [poId, dispatch, purchaseOrders, allItems])

  //pass to item Picker
  const selectItem = useCallback((item) => {
    let isExist = items.find(record => record._id === item._id);
    if(isExist)
    {
      dispatch( change(formName, `items[${item._id}].quantity`, Number(values[item._id].quantity) + 1));
      let newItems = items.filter(record => record._id !== item._id);
      newItems.unshift(isExist);
      setItems(newItems);
    }else
    {
      let { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, costPrice, salePrice, currentStock, packParentId, packQuantity, packSalePrice } = item;
      let lowStock = item.currentStock < item.minStock;
      let overStock = item.currentStock > item.maxStock
      if(item.packParentId)
      {
        let parentItem = allItems.find(record => record._id === item.packParentId);
        if(parentItem)
        {
          currentStock = parentItem.currentStock; 
          lowStock = parentItem.currentStock < parentItem.minStock;
          overStock = parentItem.currentStock > parentItem.maxStock
        }
        costPrice = (item.packQuantity * costPrice).toFixed(2);
      }
      let newItem = { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, costPrice, salePrice, currentStock, packParentId, packQuantity, packSalePrice, lowStock, overStock, quantity: 1 };
      dispatch( change(formName, `items[${_id}]`, {_id, costPrice, salePrice, packSalePrice, quantity: 1, adjustment: 0, tax: 0, notes: "", batches:[{ batchNumber: "", batchExpiryDate: null, batchQuantity: 0 }] }));
      setItems([
        newItem,
        ...items
      ]);
    }
  }, [items, values, allItems, dispatch]);

  //Pass to item Picker, or delete item from list
  const removeItem = useCallback((item) => {
    dispatch( change(formName, `items[${item._id}]`, ""));
    setItems(prevItems => prevItems.filter(record => record._id !== item._id));
  }, [dispatch]);

  useEffect(() => {
    dispatch(initialize(formName, { 
      grnDate: moment().format("DD MMMM, YYYY hh:mm A"),
      payOrCredit: payOrCreditOptions.PAY_NOW,
      paymentMode: paymentModes.PAYMENT_MODE_CASH,
      poId: 0, 
      billDate: moment().format("DD MMMM, YYYY"), 
      billDueDate: moment().format("DD MMMM, YYYY"),
      bankId: defaultBankId 
    }
    ));
  }, [dispatch, defaultBankId]);

  const totalQuantity = useMemo(() => {
    let total = 0;
    for(let key in values)
    {
      let item = values[key];
      if(!item) continue;
      if(isNaN(item.quantity))
        total += 0
      else
        total += Number(item.quantity);
    }
    return (+total.toFixed(2)).toLocaleString()
  }, [values]);

  const totalAmount = useMemo(() => {
    let total = 0;
    for(let key in values)
    {
      let item = values[key];
      if(!item) continue;
      let costPrice = isNaN(item.costPrice) ? 0 :  Number(item.costPrice);
      let quantity = isNaN(item.quantity) ? 0 :  Number(item.quantity);
      let adjustment = isNaN(values[item._id].adjustment) ? 0 :  quantity * Number(values[item._id].adjustment);
      let tax = isNaN(values[item._id].tax) ? 0 :  quantity * Number(values[item._id].tax);
      total += costPrice * quantity;
      total += tax;
      total -= adjustment;
    }
    return +total.toFixed(2);
  }, [values]);

  const anyZeroQuantity = useMemo(() => {
    for(let key in values)
    {
      let item = values[key];
      if(!item) continue;
      let quantity = isNaN(item.quantity) ? 0 :  Number(item.quantity);
      if(quantity === 0) return true; 
    }
    return false;
  }, [values]);

  const grnTotal = useMemo(() => {
    let total = Number(totalAmount);
    total += isNaN(formValues.loadingExpense) ? 0 : Number(formValues.loadingExpense);
    total += isNaN(formValues.freightExpense) ? 0 : Number(formValues.freightExpense);
    total += isNaN(formValues.otherExpense) ? 0 : Number(formValues.otherExpense);
    total += isNaN(formValues.adjustmentAmount) ? 0 : Number(formValues.adjustmentAmount);
    total += isNaN(formValues.purchaseTax) ? 0 : Number(formValues.purchaseTax);
    return +total.toFixed(2);
  }, [totalAmount, formValues.loadingExpense, formValues.freightExpense, formValues.otherExpense, formValues.adjustmentAmount, formValues.purchaseTax])

  useEffect(() => {
    if(submitSucceeded)
      history.push('/purchase/grns');
  }, [submitSucceeded, history])

  const onSubmit = useCallback((formData, dispatch, { storeId, itemsLastUpdatedOn }) => {
    const payload = {storeId, ...formData};
    payload.grnDate = moment(formData.grnDate, "DD MMMM, YYYY hh:mm A").toDate();
    payload.billDate = moment(formData.billDate, "DD MMMM, YYYY").toDate();
    payload.billDueDate = moment(formData.billDueDate, "DD MMMM, YYYY").toDate();
    payload.items = [];
    items.forEach(item => {
      let record = formData.items[item._id];
      record.batches.forEach((batch, index) => {
        if(batch.batchExpiryDate)
          record.batches[index].batchExpiryDate = moment(batch.batchExpiryDate, batchDateFormat).toDate();
      });
      payload.items.push(record);
    });
    dispatch(showProgressBar());
    return axios.post('/api/grns/create', payload).then( response => {
      dispatch(hideProgressBar());
      if(response.data.grn._id)
      {
        dispatch( syncItems(itemsLastUpdatedOn) );
        dispatch( itemsStampChanged(storeId, response.data.now) );
        dispatch( addNewGrn(storeId, response.data.grn) );
        dispatch( showSuccess("New GRN added") );
        if(response.data.supplier)
          dispatch( updateSupplier(storeId, response.data.supplier._id, response.data.supplier, response.data.now, response.data.lastAction) );
        if(response.data.accountTxn)
          dispatch( addNewTxns( storeId, [response.data.accountTxn] ) );
        if(payload.poId)
          dispatch( closePurchaseOrder(payload.poId) );
        if(formData.printGrn)
          printGrn({ ...response.data.grn, supplier });
      }

    }).catch(err => {
      dispatch(hideProgressBar());
      throw new SubmissionError({
        _error: err.response && err.response.data.message ? err.response.data.message: err.message
      });
    });
  }, [items, supplier, printGrn]);
    return(
      <>
      <Box width="100%" justifyContent="space-between" display="flex">
        <Typography gutterBottom variant="h6" align="center" style={{ flexGrow: 1 }}>
          Create New GRN
        </Typography>
      </Box>
      <Box margin="auto" width="100%">
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box display="flex" justifyContent="space-between" flexWrap="wrap">
            <Box width={{ xs: '100%', md: '32%' }}>
              <SelectSupplier formName={formName} />   
            </Box>
            <Box width={{ xs: '100%', md: '32%' }} pt={1}>
              <Field
                component={SelectInput}
                options={poOptions}
                name="poId"
                fullWidth={true}
                variant="outlined"
                margin="dense"
                disabled={!supplierId}
              />
            </Box>
            <Box width={{ xs: '100%', md: '32%' }}>
              <Field
              component={DateTimeInput}
              name="grnDate"
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
              disabled={!supplierId}
              />    
            </Box>
          </Box>
          <Box display="flex" justifyContent="space-between" flexWrap="wrap">
            <Box width={{ xs: '100%', md: '24%' }} mb={2}>
              <Field
                component={RadioInput}
                options={payNowOrCreditOptions}
                label="Payment"
                id="payOrCredit"
                name="payOrCredit"
                disabled={!supplierId}
              />   
            </Box>
              <Box width={{ xs: '100%', md: '24%' }} mb={2}>
                {
                  parseInt(formValues.payOrCredit) === payOrCreditOptions.PAY_NOW ?
                  <Field
                    component={RadioInput}
                    options={paymentModeOptions}
                    label="Mode"
                    id="paymentMode"
                    name="paymentMode"
                    disabled={!supplierId}
                  />
                  : null
                }
              </Box>
              <Box width={{ xs: '100%', md: '24%' }} pt={1}>
                {
                  parseInt(formValues.payOrCredit) === payOrCreditOptions.PAY_NOW && parseInt(formValues.paymentMode) === paymentModes.PAYMENT_MODE_BANK ?
                  <Field
                    component={SelectInput}
                    options={banks}
                    name="bankId"
                    fullWidth={true}
                    variant="outlined"
                    margin="dense"
                    disabled={!supplierId}
                  />
                  : null
                }
              </Box>
              <Box width={{ xs: '100%', md: '24%' }} >
                {
                  parseInt(formValues.payOrCredit) === payOrCreditOptions.PAY_NOW && parseInt(formValues.paymentMode) === paymentModes.PAYMENT_MODE_BANK ?
                  <Field
                    component={TextInput}
                    name="chequeTxnId"
                    label="Cheque No./Transaction ID"
                    placeholder="Cheque No./Transaction ID..."
                    type="text"
                    fullWidth={true}
                    variant="outlined"
                    margin="dense"
                    showError={false}
                    disabled={!supplierId}
                  />
                  : null
                }
              </Box>
          </Box>
          <Box display="flex" justifyContent="space-between" flexWrap="wrap" alignItems="center">
            <Box width={{ xs: '100%', md: '31%' }}>
              <ItemPicker disabled={!supplierId} {...{supplierId, selectItem, removeItem, selectedItems: items}} />
            </Box>
            <Box width={{ xs: '100%', md: '31%' }} height="52px" display="flex" alignItems="center" justifyContent="center">
              <Typography align="center">Total Quantity: <b>{ totalQuantity }</b></Typography>
            </Box>
            <Box width={{ xs: '100%', md: '31%' }} height="52px" display="flex" alignItems="center" justifyContent="center">
              <Typography align="center">Items Total Amount: <b>{ totalAmount.toLocaleString() }</b></Typography>
            </Box>
          </Box>
          <Box style={{ backgroundColor: '#ececec' }} p={1} borderRadius={6} my={1}>
            <Box style={{ backgroundColor: '#fff' }} p={ items.length === 0 ? 5 : 0 }>
              {
                items.length === 0 ?
                <Typography style={{ color: '#7c7c7c' }} align="center"> Add items manually or select purchase order to create GRN </Typography>
                :
                <TableContainer style={{ overflowY:  "hidden" }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell style={{ minWidth: 10 }}></TableCell>
                        <TableCell style={{ minWidth: 280 }}>Item</TableCell>
                        <TableCell style={{ minWidth: 50 }} align="center">Stock</TableCell>
                        <TableCell style={{ minWidth: 70 }} align="center">Cost Price</TableCell>
                        <TableCell style={{ minWidth: 70 }} align="center">Quantity</TableCell>
                        <TableCell style={{ minWidth: 70 }} align="center">Amount</TableCell>
                        <TableCell style={{ minWidth: 40 }} align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {
                        items.map((item, index) => <GrnItemRow key={item._id} {...{ item, values, supplierId, removeItem }} /> )
                      }
                    </TableBody>
                  </Table>
                </TableContainer>
              }
            </Box>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box width={{ xs: '100%', md: '48%' }} display="flex" justifyContent="space-between" flexWrap="wrap">
              <Box width={{ xs: '100%', md: '48%' }}>
                <Field
                  component={TextInput}
                  name="supplierInvoiceNumber"
                  label="Supplier Invoice No."
                  placeholder="Supplier invoice number..."
                  type="text"
                  fullWidth={true}
                  variant="outlined"
                  margin="dense"
                  showError={false}
                  disabled={!supplierId}
                />
              </Box>
              <Box width={{ xs: '100%', md: '48%' }}>
                <Field
                  component={TextInput}
                  name="billNumber"
                  label="Bill No."
                  placeholder="Supplier bill number..."
                  type="text"
                  fullWidth={true}
                  variant="outlined"
                  margin="dense"
                  showError={false}
                  disabled={!supplierId}
                />
              </Box>
              <Box width={{ xs: '100%', md: '48%' }}>
                <Field
                  component={DateInput}
                  name="billDate"
                  label="Bill Date"
                  placeholder="Bill date..."
                  dateFormat="DD MMMM, YYYY"
                  fullWidth={true}
                  inputVariant="outlined"
                  disablePast
                  margin="dense"
                  emptyLabel=""
                  disabled={!supplierId}
                />
              </Box>
              <Box width={{ xs: '100%', md: '48%' }}>
                <Field
                  component={DateInput}
                  name="billDueDate"
                  label="Due Date"
                  placeholder="Due date..."
                  dateFormat="DD MMMM, YYYY"
                  fullWidth={true}
                  inputVariant="outlined"
                  disablePast
                  margin="dense"
                  emptyLabel=""
                  disabled={!supplierId}
                />
              </Box>
              <Box width={{ xs: '100%', md: '100%' }}>
                <Field
                  component={UploadFile}
                  storeId={storeId}
                  label="Attachment"
                  name="attachment"
                  imageWidth={1920}
                  disabled={!supplierId}
                  fullWidth={true}
                  filePath="grns/"
                />
              </Box>
            </Box>
            <Box width={{ xs: '100%', md: '48%' }} display="flex" justifyContent="space-between" flexWrap="wrap">
              <Box width={{ xs: '100%', md: '48%' }}>
                <Field
                  component={TextInput}
                  name="loadingExpense"
                  label="Loading Expense"
                  placeholder="Loading expense..."
                  fullWidth={true}
                  variant="outlined"
                  margin="dense"
                  disabled={!supplierId}
                  showError={false}
                  onKeyDown={allowOnlyPostiveNumber}
                />
              </Box>
              <Box width={{ xs: '100%', md: '48%' }}>
                <Field
                  component={TextInput}
                  name="freightExpense"
                  label="Freight Expense"
                  placeholder="Freight expense..."
                  fullWidth={true}
                  variant="outlined"
                  margin="dense"
                  disabled={!supplierId}
                  showError={false}
                  onKeyDown={allowOnlyPostiveNumber}
                />
              </Box>
              <Box width={{ xs: '100%', md: '48%' }}>
                <Field
                  component={TextInput}
                  name="otherExpense"
                  label="Other Expense"
                  placeholder="Other expense..."
                  fullWidth={true}
                  variant="outlined"
                  margin="dense"
                  disabled={!supplierId}
                  showError={false}
                  onKeyDown={allowOnlyPostiveNumber}
                />
              </Box>
              <Box width={{ xs: '100%', md: '48%' }}>
                <Field
                  component={TextInput}
                  name="adjustmentAmount"
                  label="Adjustment Amount"
                  placeholder="Adjustment amount..."
                  fullWidth={true}
                  variant="outlined"
                  margin="dense"
                  disabled={!supplierId}
                  showError={false}
                />
              </Box>
              <Box width={{ xs: '100%', md: '48%' }}>
                <Field
                  component={TextInput}
                  name="purchaseTax"
                  label="Purchase Tax"
                  placeholder="Purchase Tax..."
                  fullWidth={true}
                  variant="outlined"
                  margin="dense"
                  disabled={!supplierId}
                  showError={false}
                  onKeyDown={allowOnlyPostiveNumber}
                />
              </Box>
              <Box width={{ xs: '100%', md: '48%' }} textAlign="center" pt={3}>
                Total: <b>{ grnTotal.toLocaleString()  }</b>
              </Box>
              <Box width={{ xs: '100%', md: '100%' }}>
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
                  disabled={!supplierId}
                />
              </Box>
            </Box>
          </Box>
          
          <Box textAlign="center">
            <Field
              component={CheckboxInput}
              name="printGrn"
              label="Print GRN"
              fullWidth={true}
              disabled={pristine || submitting || invalid || !dirty}
            />
          </Box>

        <Box textAlign="center">
          <Button disableElevation type="submit" variant="contained" color="primary" disabled={pristine || submitting || invalid || !dirty || Number(totalQuantity) === 0} >
            Create GRN
          </Button>
          {
            items.length && Number(totalQuantity) === 0 ?
            <FormHelperText className={classes.formError} error={true}>
              <Typography component="span">Total quantity should not be zero</Typography>
            </FormHelperText>  
            : null
          }
          {
            items.length && Number(totalQuantity) !== 0 && anyZeroQuantity  ?
            <Typography style={{ color: '#7c7c7c' }}>Items with zero quantity will be removed</Typography>  
            : null
          }
          {  
            <FormHelperText className={classes.formError} error={true} style={{visibility: !submitting && error ? 'visible' : 'hidden' }}>
              <Typography component="span">{ error ? error : 'invalid request' }</Typography>
            </FormHelperText>  
          }
          
        </Box>
        </form>
      </Box>
      </>
    )
}

const validate = (values, props) => {
  const { dirty, lastEndOfDay } = props;
  if(!dirty) return {};
  const errors = { items: {} };
  if(!values.supplierId)
   errors.supplierId = "Please select supplier first";
  if(lastEndOfDay && moment(values.grnDate, "DD MMMM, YYYY hh:mm A") <= moment(lastEndOfDay))
    errors.grnDate = "Date & time should be after last day closing: " + moment(lastEndOfDay).format("DD MMMM, YYYY hh:mm A");
  else if(moment(values.grnDate, "DD MMMM, YYYY hh:mm A") > moment())
    errors.grnDate = "Date & time should not be after current time: " + moment().format("DD MMMM, YYYY hh:mm A"); 
  for(let itemId in values.items)
  {
    if(values.items[itemId] === undefined) continue;
    errors.items[itemId] = { batches: {} };
    let quantity = Number(values.items[itemId].quantity);
    if( !quantity )
    {
      errors.items[itemId].quantity = "invalid quantity";
      continue;
    }
    let batchQuantity = 0;
    let batchCount = 0;
    values.items[itemId].batches.forEach((batch, index) => {
      if(!batch.batchNumber) return;
      if(!Number(batch.batchQuantity)) errors.items[itemId].batches._error = "Batch quantity is required";
      if(!batch.batchExpiryDate) errors.items[itemId].batches._error = "Batch expiry date is required";
      batchCount++;
      batchQuantity += Number(batch.batchQuantity);
    });
    if(batchCount && batchQuantity !== quantity && !errors.items[itemId].batches._error) //batches applied but quantity doesn't match
      errors.items[itemId].batches._error = "Sum of batch quantities should be equal to total quantity";
  }
  return errors;
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

export default compose(
connect(mapStateToProps),
reduxForm({
  'form': formName,
  validate
})
)(CreateGrn);