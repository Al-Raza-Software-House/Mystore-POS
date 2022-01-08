import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { makeStyles, Button, Box, Typography, FormHelperText, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, IconButton } from '@material-ui/core'
import { change, Field, getFormValues, initialize, reduxForm, SubmissionError } from 'redux-form';
import axios from 'axios';
import TextInput from '../../library/form/TextInput';
import { showProgressBar, hideProgressBar } from '../../../store/actions/progressActions';
import { connect } from 'react-redux';
import { showError, showSuccess } from '../../../store/actions/alertActions';
import { compose } from 'redux';
import { Redirect, useHistory, useParams } from 'react-router-dom';
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
import { updateGrn } from '../../../store/actions/grnActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { updateSupplier } from '../../../store/actions/supplierActions';
import { addNewTxns, updateTxns, actionTypes as accountActions } from '../../../store/actions/accountActions';
import { itemsStampChanged, syncItems } from '../../../store/actions/itemActions';

const payNowOrCreditOptions = [
  { id: payOrCreditOptions.PAY_NOW, title: "Pay Now" },
  { id: payOrCreditOptions.ON_CREDIT, title: "Credit" },
];

const paymentModeOptions = [
  { id: paymentModes.PAYMENT_MODE_CASH, title: "Cash" },
  { id: paymentModes.PAYMENT_MODE_BANK, title: "Bank" },
]

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

const formName = "editGrn";

function EditGrn(props) {
  const history = useHistory();
  const { storeId, grnId } = useParams();
  const { dispatch, banks, lastEndOfDay, handleSubmit, pristine, submitSucceeded, submitting, error, invalid, dirty, printGrn} = props;
  const grn  = useSelector(state => {
    let grns = state.grns[storeId] ? state.grns[storeId].records : [];
    return grns.find(record => record._id === grnId);
  })
  const beforeLastEndOfDay = useMemo(() => {
    if(!grn) return false;
    return lastEndOfDay && moment(grn.grnDate) <= moment(lastEndOfDay);
  }, [grn, lastEndOfDay]);

  const classes = useStyles();
  const formValues = useSelector(state => {
    let formData = getFormValues(formName)(state);
    if(formData)
      return !formData.items ? { ...formData, items: []} : formData;
    else
      return { items: [] }
  });
  const { supplierId } = formValues;
  const values = formValues.items;
  const supplier = useSelector(state => state.suppliers[storeId] ? state.suppliers[storeId].find(record => record._id === supplierId) : null);
  const allItems = useSelector(state => state.items[storeId].allItems );

  
  const [items, setItems] = useState([]);//selected items
  const [po, setPo] = useState(null);

  useEffect(() => {
    if(!grn) return;
    let formItems = {};
    grn.items.forEach(item => {
      item.batches.forEach( (batch, index) => {
        if(item.batches[index].batchExpiryDate)
          item.batches[index].batchExpiryDate = moment( item.batches[index].batchExpiryDate ).toDate();
      })
      if(item.batches.length === 0)
       item.batches.push({
         batchNumber: "",
         batchExpiryDate: null,
         batchQuantity: 0
       })

      formItems[item._id] = item;
    })
    let paymentMode = grn.bankId ? paymentModes.PAYMENT_MODE_BANK : paymentModes.PAYMENT_MODE_CASH;
    dispatch(initialize(formName, { ...grn, paymentMode,  items: formItems, grnDate: moment(grn.grnDate).format("DD MMMM, YYYY hh:mm A"), billDate: moment(grn.billDate).format("DD MMMM, YYYY"), billDueDate: moment(grn.billDueDate).format("DD MMMM, YYYY")  }));
    let selectedItems = [];
    grn.items.forEach(item => {
      let storeItem = allItems.find(record => record._id === item._id);
      if(storeItem)
      {
        let { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, currentStock, packParentId, packQuantity } = storeItem;
        let lowStock = storeItem.currentStock < storeItem.minStock;
        let overStock = storeItem.currentStock > storeItem.maxStock
        if(storeItem.packParentId)
        {
          let parentItem = allItems.find(record => record._id === storeItem.packParentId);
          if(parentItem)
          {
            currentStock = parentItem.currentStock; 
            lowStock = parentItem.currentStock < parentItem.minStock;
            overStock = parentItem.currentStock > parentItem.maxStock
          }
        }
        let newItem = { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, costPrice: item.costPrice, salePrice: item.salePrice, currentStock, packParentId, packQuantity, packSalePrice: item.packSalePrice, lowStock, overStock, quantity: item.quantity };
        selectedItems.push(newItem);
      }
    });
    setItems(selectedItems);
    if(!grn.poId) return;
    axios.get('/api/purchaseOrders/', { params: { storeId, supplierId: grn.supplierId, poId: grn.poId } }).then(({ data }) => {
      if(data.order._id)
        setPo(data.order);
    }).catch(err => {
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    });

  }, [grn, allItems, dispatch, storeId]);

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
        costPrice = item.packQuantity * costPrice;
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

  const onSubmit = useCallback((formData, dispatch, { match, itemsLastUpdatedOn }) => {
    const payload = {...match.params, ...formData};
    payload.grnDate = moment(formData.grnDate, "DD MMMM, YYYY hh:mm A").toDate();
    payload.billDate = moment(formData.billDate, "DD MMMM, YYYY").toDate();
    payload.billDueDate = moment(formData.billDueDate, "DD MMMM, YYYY").toDate();
    payload.items = [];
    items.forEach(item => {
      let record = formData.items[item._id];
      record.batches.forEach((batch, index) => {
        if(batch.batchExpiryDate)
          record.batches[index].batchExpiryDate = moment(batch.batchExpiryDate, "DD MMM, YYYY").toDate();
      });
      payload.items.push(record);
    });
    dispatch(showProgressBar());
    return axios.post('/api/grns/update', payload).then( response => {
      dispatch(hideProgressBar());
      if(response.data.grn._id)
      {
        dispatch( syncItems(itemsLastUpdatedOn) );
        dispatch( itemsStampChanged(match.params.storeId, response.data.now) );
        dispatch( updateGrn(match.params.storeId, match.params.grnId, response.data.grn) );
        if(response.data.supplier)
          dispatch( updateSupplier(match.params.storeId, response.data.supplier._id, response.data.supplier, response.data.now, response.data.lastAction) );
        if(response.data.deleteAccountTxnId)
          dispatch( { type: accountActions.TRANSACTION_DELETED, storeId: match.params.storeId, txnId: response.data.deleteAccountTxnId } );
        if(response.data.addAccountTxn)
          dispatch( addNewTxns(match.params.storeId, [response.data.addAccountTxn]) );
        if(response.data.updateAccountTxn)
          dispatch( updateTxns(match.params.storeId, response.data.updateAccountTxn._id, [response.data.updateAccountTxn]) );
        if(response.data.itemsNotUpdated)
          dispatch( showSuccess(`GRN updated, ${response.data.itemsNotUpdated} item(s) couldn't be updated because those were also purhchased after this GRN`) );
        else
          dispatch( showSuccess("GRN updated") );
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

  if(!grnId || !grn)
  {
    dispatch(showError("Record not found"));
    return <Redirect to="/purchase/grns" />
  }
    return(
      <>
      <Box width="100%" justifyContent="space-between" display="flex">
        <Typography gutterBottom variant="h6" align="center" style={{ flexGrow: 1 }}>
          Update GRN
        </Typography>
      </Box>
      <Box margin="auto" width="100%">
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box display="flex" justifyContent="space-between" flexWrap="wrap">
            <Box width={{ xs: '100%', md: '32%' }}>
              <SelectSupplier formName={formName} addNewRecord={false} disabled={true} />   
            </Box>
            <Box width={{ xs: '100%', md: '32%' }} pt={2}>
              {
                !po ? null :
                <Typography style={{ color: '#7c7c7c' }} align="center"> { `PO# ${po.poNumber} - ${ moment(po.issueDate).format("DD MMMM, YYYY") }` } </Typography>
              }
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
              disabled={beforeLastEndOfDay}
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
                disabled={beforeLastEndOfDay}
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
                    disabled={beforeLastEndOfDay}
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
                    disabled={beforeLastEndOfDay}
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
                    disabled={beforeLastEndOfDay}
                  />
                  : null
                }
              </Box>
          </Box>
          <Box display="flex" justifyContent="space-between" flexWrap="wrap" alignItems="center">
            <Box width={{ xs: '100%', md: '31%' }}>
              <ItemPicker disabled={beforeLastEndOfDay} {...{supplierId, selectItem, removeItem, selectedItems: items}} />
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
                        <TableCell style={{ minWidth: 20 }}></TableCell>
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
                        items.map((item, index) => <GrnItemRow key={item._id} {...{ item, values, supplierId, removeItem, beforeLastEndOfDay }} /> )
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
                  disabled={beforeLastEndOfDay}
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
                  disabled={beforeLastEndOfDay}
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
                  disabled={beforeLastEndOfDay}
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
                  disabled={beforeLastEndOfDay}
                />
              </Box>
              <Box width={{ xs: '100%', md: '100%' }}>
                <Field
                  component={UploadFile}
                  storeId={storeId}
                  label="Attachment"
                  name="attachment"
                  imageWidth={1920}
                  disabled={beforeLastEndOfDay}
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
                  disabled={beforeLastEndOfDay}
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
                  disabled={beforeLastEndOfDay}
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
                  disabled={beforeLastEndOfDay}
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
                  disabled={beforeLastEndOfDay}
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
                  disabled={beforeLastEndOfDay}
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
                  disabled={beforeLastEndOfDay}
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
              disabled={!dirty}
            />
          </Box>

        <Box textAlign="center">
          <Button disableElevation type="submit" variant="contained" color="primary" disabled={beforeLastEndOfDay || pristine || submitting || invalid || !dirty || Number(totalQuantity) === 0} >
            Update GRN
          </Button>
          {
            dirty ? null :
            <IconButton style={{ marginLeft: 8}} title="Print GRN" onClick={ () => printGrn({ ...grn, supplier}) } >
              <FontAwesomeIcon icon={faPrint} size="xs" />
            </IconButton>
          }
          {
            beforeLastEndOfDay ?
            <Typography component="div" style={{ color: '#7c7c7c', marginTop: 10, marginBottom: 10 }}>Cannot update this GRN because it is dated before Last end of Day: { moment(lastEndOfDay).format("DD MMM, YYYY, hh:mm A") }</Typography>
            : null
          }
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
  const errors = { items: {}};
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
  const itemsLastUpdatedOn = state.system.lastUpdatedStamps[storeId] ? state.system.lastUpdatedStamps[storeId].items : null;
  return{
    storeId,
    banks: banks.map(bank => ({ id: bank._id, title: bank.name }) ),
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
)(EditGrn);