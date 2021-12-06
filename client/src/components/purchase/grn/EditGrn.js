import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { makeStyles, Button, Box, Typography, FormHelperText, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, IconButton } from '@material-ui/core'
import { change, Field, formValueSelector, initialize, reduxForm, SubmissionError } from 'redux-form';
import axios from 'axios';
import TextInput from '../../library/form/TextInput';
import { showProgressBar, hideProgressBar } from '../../../store/actions/progressActions';
import { showSuccess } from '../../../store/actions/alertActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen, faExclamationTriangle, faPrint, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useHistory, useParams } from 'react-router-dom';
import SelectSupplier from '../../stock/items/itemForm/SelectSupplier';
import DateInput from '../../library/form/DateInput';
import { useSelector } from 'react-redux';
import ItemPicker from '../../library/ItemPicker';
import { updatePO } from '../../../store/actions/purchaseOrderActions';
import moment from 'moment';
import CheckboxInput from '../../library/form/CheckboxInput';

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
const formName = "editPurchaseOrder";
const formSelector = formValueSelector(formName);

const calculateMargin = (item, values, showInPercent=false) => {
  if(item.salePrice === 0) return 0;
  let costPrice = isNaN(values[item._id].costPrice) ? 0 : Number(values[item._id].costPrice);
  let salePrice = item.packParentId ? item.packSalePrice : item.salePrice;
  let margin = salePrice - costPrice;
  if(!showInPercent) return (+margin.toFixed(2)).toLocaleString();
  return +((margin/salePrice)*100).toFixed(2);
}

function EditGrn(props) {
  const history = useHistory();
  const { storeId, poId } = useParams();
  const order  = useSelector(state => {
    let orders = state.purchaseOrders[storeId] ? state.purchaseOrders[storeId].records : [];
    return orders.find(record => record._id === poId);
  })

  const classes = useStyles();
  const { dispatch, handleSubmit, pristine, submitSucceeded, submitting, error, invalid, dirty, printPo } = props;
  const supplierId = useSelector(state => formSelector(state, 'supplierId'));
  const supplier = useSelector(state => state.suppliers[storeId] ? state.suppliers[storeId].find(record => record._id === supplierId) : null);
  const allItems = useSelector(state => state.items[storeId].allItems );
  const values = useSelector(state => {
    let records = formSelector(state, 'items');
    return records ? records : []
  } );
  
  useEffect(() => {
    let formItems = {};
    order.items.forEach(item => {
      formItems[item._id] = item;
    })
    dispatch(initialize(formName, { ...order, items: formItems, issueDate: moment(order.issueDate).format("DD MMMM, YYYY"), deliveryDate: moment(order.deliveryDate).format("DD MMMM, YYYY") }));
    let selectedItems = [];
    order.items.forEach(item => {
      let storeItem = allItems.find(record => record._id === item._id);
      if(storeItem)
      {
        let { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, salePrice, currentStock, packParentId, packQuantity, packSalePrice } = storeItem;
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
        let newItem = { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, costPrice: item.costPrice, salePrice, currentStock, packParentId, packQuantity, packSalePrice, lowStock, overStock, quantity: item.quantity };
        selectedItems.push(newItem);
      }
    });
    setItems(selectedItems);
  }, [order, allItems, dispatch]);

  const [items, setItems] = useState([]);

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
      dispatch( change(formName, `items[${_id}]._id`, _id));
      dispatch( change(formName, `items[${_id}].costPrice`, costPrice));
      dispatch( change(formName, `items[${_id}].quantity`, 1));
      setItems([
        newItem,
        ...items
      ]);
    }
  }, [items, values, allItems, dispatch]);

  const removeItem = useCallback((item) => {
    dispatch( change(formName, `items[${item._id}]`, undefined));
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
      total += costPrice * quantity;
    }
    return (+total.toFixed(2)).toLocaleString()
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

  useEffect(() => {
    if(submitSucceeded)
      history.push('/purchase');
  }, [submitSucceeded, history])

  const onSubmit = useCallback((formValues, dispatch, { match }) => {
    const payload = {...match.params, ...formValues};
    payload.issueDate = moment(formValues.issueDate, "DD MMMM, YYYY").toDate();
    payload.deliveryDate = moment(formValues.deliveryDate, "DD MMMM, YYYY").toDate();
    payload.items = [];
    items.forEach(item => {
      payload.items.push(
        formValues.items[item._id]
      )
    });
    dispatch(showProgressBar());
    return axios.post('/api/purchaseOrders/update', payload).then( response => {
      dispatch(hideProgressBar());
      if(response.data.order._id)
      {
        dispatch( updatePO(match.params.storeId, match.params.poId, response.data.order) );
        dispatch( showSuccess("purchase order updated") );
        if(formValues.printPo)
          printPo({ ...response.data.order, supplier });
      }

    }).catch(err => {
      dispatch(hideProgressBar());
      throw new SubmissionError({
        _error: err.response && err.response.data.message ? err.response.data.message: err.message
      });
    });
  }, [items, supplier, printPo]);
    return(
      <>
      <Box width="100%" justifyContent="space-between" display="flex">
        <Typography gutterBottom variant="h6" align="center" style={{ flexGrow: 1 }}>
          Update Purchase Order
        </Typography>
      </Box>
      <Box margin="auto" width="100%">
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box display="flex" justifyContent="space-between" flexWrap="wrap">
            <Box width={{ xs: '100%', md: '24%' }}>
              <SelectSupplier formName={formName} />   
            </Box>
            <Box width={{ xs: '100%', md: '24%' }}>
              <Field
              component={TextInput}
              name="referenceNumber"
              label="Reference No."
              placeholder="Reference number..."
              fullWidth={true}
              variant="outlined"
              margin="dense"
              disabled={!supplierId}
              />    
            </Box>
            <Box width={{ xs: '100%', md: '24%' }}>
              <Field
              component={DateInput}
              name="issueDate"
              label="Issue Date"
              placeholder="Issue date..."
              dateFormat="DD MMMM, YYYY"
              fullWidth={true}
              inputVariant="outlined"
              disablePast
              margin="dense"
              emptyLabel=""
              disabled={!supplierId}
              />    
            </Box>
            <Box width={{ xs: '100%', md: '24%' }}>
              <Field
              component={DateInput}
              name="deliveryDate"
              label="Delivery Date"
              placeholder="Delivery date..."
              dateFormat="DD MMMM, YYYY"
              fullWidth={true}
              inputVariant="outlined"
              disablePast
              margin="dense"
              emptyLabel=""
              disabled={!supplierId}
              />    
            </Box>
          </Box>
          <Box display="flex" justifyContent="space-between" flexWrap="wrap" alignItems="center">
            <Box width={{ xs: '100%', md: '31%' }}>
              <ItemPicker disabled={!supplierId} {...{supplierId, selectItem, removeItem, selectedItems: items}} />
            </Box>
            <Box width={{ xs: '100%', md: '31%' }}>
              <Typography align="center">Total Quantity: <b>{ totalQuantity }</b></Typography>
            </Box>
            <Box width={{ xs: '100%', md: '31%' }}>
              <Typography align="center">Total Amount: <b>{ totalAmount }</b></Typography>
            </Box>
          </Box>
          <Box style={{ backgroundColor: '#ececec' }} p={1} borderRadius={6} my={1}>
            <Box style={{ backgroundColor: '#fff' }} p={ items.length === 0 ? 5 : 0 }>
              {
                items.length === 0 ?
                <Typography style={{ color: '#7c7c7c' }} align="center"> add some items to create purchase order </Typography>
                :
                <TableContainer>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell style={{ minWidth: 280 }}>Item</TableCell>
                        <TableCell style={{ minWidth: 50 }} align="center">Stock</TableCell>
                        <TableCell style={{ minWidth: 70 }} align="center">Cost Price</TableCell>
                        <TableCell style={{ minWidth: 50 }} align="center">Margin</TableCell>
                        <TableCell style={{ minWidth: 70 }} align="center">Quantity</TableCell>
                        <TableCell style={{ minWidth: 70 }} align="center">Amount</TableCell>
                        <TableCell style={{ minWidth: 40 }} align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {
                        items.map((item, index) => (
                          <TableRow hover key={item._id}>
                            <TableCell>
                              <Box my={1} display="flex" justifyContent="space-between">
                                <span>
                                  {item.itemName}
                                </span>
                                { item.packParentId ? <span style={{ color: '#7c7c7c' }}>Packing <FontAwesomeIcon title="Packing" style={{ marginLeft: 4 }} icon={faBoxOpen} /> </span> : null }
                                {
                                  item.sizeName ?
                                  <span style={{ color: '#7c7c7c' }}> {item.sizeName} | {item.combinationName} </span>
                                  : null
                                }
                              </Box>
                              <Box mb={1} display="flex" justifyContent="space-between" style={{ color: '#7c7c7c' }}>
                                <span>{item.itemCode}{item.sizeCode ? '-'+item.sizeCode+'-'+item.combinationCode : '' }</span>
                                <span>Price: { item.packParentId ? item.packSalePrice.toLocaleString() : item.salePrice.toLocaleString() } </span>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              {item.currentStock.toLocaleString()}
                              { item.lowStock ? <FontAwesomeIcon title="Low Stock" color="#c70000" style={{ marginLeft: 4 }} icon={faExclamationTriangle} /> : null }
                              { item.overStock ? <FontAwesomeIcon title="Over Stock" color="#06ba3a" style={{ marginLeft: 4 }} icon={faExclamationTriangle} /> : null }
                              { item.packParentId ? <Box style={{ color: '#7c7c7c' }}>units</Box> : null }
                            </TableCell>
                            <TableCell align="center">
                              <Box height="100%" display="flex" justifyContent="center" alignItems="center">
                                <Field
                                  component={TextInput}
                                  label="Cost Price"
                                  name={`items[${item._id}].costPrice`}
                                  placeholder="Cost Price..."
                                  fullWidth={true}
                                  variant="outlined"
                                  margin="dense"
                                  type="number"
                                  disabled={!supplierId}
                                  inputProps={{  min: 0 }}
                                  showError={false}
                                  onKeyDown={(e) => {
                                      if(!((e.keyCode > 95 && e.keyCode < 106)
                                        || (e.keyCode > 47 && e.keyCode < 58) 
                                        || e.keyCode === 8 || e.keyCode === 9 || e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 110 || e.keyCode === 190 )) {
                                          e.preventDefault();
                                          return false;
                                      }
                                  }}
                                />
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Box mb={1}>{ calculateMargin(item, values) }</Box>
                              <Box style={{ color: '#7c7c7c' }}>{ calculateMargin(item, values, true) }%</Box>
                            </TableCell>
                            <TableCell align="center">
                              <Field
                                component={TextInput}
                                label="Quantity"
                                name={`items[${item._id}].quantity`}
                                placeholder="Quantity..."
                                fullWidth={true}
                                variant="outlined"
                                margin="dense"
                                type="number"
                                disabled={!supplierId}
                                inputProps={{  min: 1 }}
                                showError={false}
                                onKeyDown={(e) => {
                                      if(!((e.keyCode > 95 && e.keyCode < 106)
                                        || (e.keyCode > 47 && e.keyCode < 58) 
                                        || e.keyCode === 8 || e.keyCode === 9 || e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 110 || e.keyCode === 190 )) {
                                          e.preventDefault();
                                          return false;
                                      }
                                  }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              { Number( ( isNaN(values[item._id].costPrice) ? 0 :  values[item._id].costPrice ) * ( isNaN(values[item._id].quantity) ? 0 :  values[item._id].quantity ) ).toLocaleString() }
                            </TableCell>
                            <TableCell align="center">
                              <IconButton disabled={!supplierId} onClick={() => removeItem(item)}>
                                <FontAwesomeIcon icon={faTimes} size="xs" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </TableContainer>
              }
            </Box>
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
              rows={3}
              margin="dense"
              disabled={!supplierId}
            />
          </Box>

          <Box textAlign="center">
            <Field
              component={CheckboxInput}
              name="printPo"
              label="Print Purchase Order"
              fullWidth={true}
              disabled={!dirty}
            />
          </Box>
          
        <Box textAlign="center">
          <Button disableElevation type="submit" variant="contained" color="primary" disabled={pristine || submitting || invalid || !dirty || Number(totalQuantity) === 0} >
            Update Purchase Order
          </Button>
          {
            dirty ? null :
            <IconButton style={{ marginLeft: 8}} title="Print Purchase Order" onClick={ () => printPo({ ...order, supplier}) } >
              <FontAwesomeIcon icon={faPrint} size="xs" />
            </IconButton>
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
  const { dirty } = props;
  if(!dirty) return {};
  const errors = {};
  if(!values.supplierId)
   errors.supplierId = "Please select supplier first";
  if(!values.issueDate)
   errors.issueDate = "Issue date is required";
  if(!values.deliveryDate)
   errors.deliveryDate = "Delivery date is required";
  return errors;
}

export default reduxForm({
  'form': formName,
  validate
})(EditGrn);