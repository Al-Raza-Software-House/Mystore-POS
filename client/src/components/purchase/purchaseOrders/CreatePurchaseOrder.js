import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { makeStyles, Button, Box, Typography, FormHelperText, TableContainer, Table, TableHead, TableBody, TableRow, TableCell } from '@material-ui/core'
import { change, Field, formValueSelector, initialize, reduxForm, SubmissionError } from 'redux-form';
import axios from 'axios';
import TextInput from '../../library/form/TextInput';
import { showProgressBar, hideProgressBar } from '../../../store/actions/progressActions';
import { connect } from 'react-redux';
import { showSuccess } from '../../../store/actions/alertActions';
import { compose } from 'redux';
import { useHistory } from 'react-router-dom';
import SelectSupplier from '../../stock/items/itemForm/SelectSupplier';
import DateInput from '../../library/form/DateInput';
import { useSelector } from 'react-redux';
import ItemPicker from '../../library/ItemPicker';
import { addNewPO } from '../../../store/actions/purchaseOrderActions';
import moment from 'moment';
import CheckboxInput from '../../library/form/CheckboxInput';
import PoItemRow from './PoItemRow';
import ReactGA from "react-ga4";

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
const formName = "createPurchaseOrder";
const formSelector = formValueSelector(formName);

function CreatePurchaseOrder(props) {
  const history = useHistory();
  const classes = useStyles();
  const { dispatch, storeId, handleSubmit, pristine, submitSucceeded, submitting, error, invalid, dirty, printPo} = props;
  const supplierId = useSelector(state => formSelector(state, 'supplierId'));
  const supplier = useSelector(state => state.suppliers[storeId] ? state.suppliers[storeId].find(record => record._id === supplierId) : null);
  const allItems = useSelector(state => state.items[storeId].allItems );
  const values = useSelector(state => {
    let records = formSelector(state, 'items');
    return records ? records : []
  } );
  
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/purchase/orders/new", 'title' : "New Purchase Order" });
  }, []);

  const [items, setItems] = useState([]);

  const getItemLastCost = useCallback((itemId) => {
    axios.get('/api/grns/lastCost', { params: { storeId, itemId } }).then(({ data }) => {
      if(data.lastCost)
        dispatch( change(formName, `items[${itemId}].costPrice`, data.lastCost) );
    }).catch(err => { 

    })
  }, [dispatch, storeId]);

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
      let { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, costPrice, salePrice, currentStock, packParentId, packQuantity, packSalePrice, minStock, maxStock } = item;
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
      let newItem = { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, costPrice, salePrice, currentStock, packParentId, packQuantity, packSalePrice, minStock, maxStock, lowStock, overStock, quantity: 1 };
      dispatch( change(formName, `items[${_id}]._id`, _id));
      dispatch( change(formName, `items[${_id}].costPrice`, costPrice));
      dispatch( change(formName, `items[${_id}].quantity`, 1));
      setItems([
        newItem,
        ...items
      ]);
      getItemLastCost(_id);
    }
  }, [items, values, allItems, dispatch, getItemLastCost]);


  const removeItem = useCallback((item) => {
    dispatch( change(formName, `items[${item._id}]`, ""));
    setItems(prevItems => prevItems.filter(record => record._id !== item._id));
  }, [dispatch]);

  useEffect(() => {
    dispatch(initialize(formName, { issueDate: moment().format("DD MMMM, YYYY"), deliveryDate: moment().format("DD MMMM, YYYY") }));
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

  const onSubmit = useCallback((formValues, dispatch, { storeId }) => {
    const payload = {storeId, ...formValues};
    payload.issueDate = moment(formValues.issueDate, "DD MMMM, YYYY").toDate();
    payload.deliveryDate = moment(formValues.deliveryDate, "DD MMMM, YYYY").toDate();
    payload.items = [];
    items.forEach(item => {
      payload.items.push(
        formValues.items[item._id]
      )
    });
    dispatch(showProgressBar());
    return axios.post('/api/purchaseOrders/create', payload).then( response => {
      dispatch(hideProgressBar());
      if(response.data.order._id)
      {
        dispatch( addNewPO(storeId, response.data.order) );
        dispatch( showSuccess("New purchase order added") );
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
          Create New Purchase Order
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
                <TableContainer style={{ overflowY:  "hidden" }}>
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
                          <PoItemRow key={item._id} item={item} formName={formName} supplierId={supplierId} removeItem={removeItem} />
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
              disabled={pristine || submitting || invalid || !dirty}
            />
          </Box>

        <Box textAlign="center">
          <Button disableElevation type="submit" variant="contained" color="primary" disabled={pristine || submitting || invalid || !dirty || Number(totalQuantity) === 0} >
            Create Purchase Order
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

const mapStateToProps = state => {
  return{
    storeId: state.stores.selectedStoreId
  }
}

export default compose(
connect(mapStateToProps),
reduxForm({
  'form': formName,
  validate
})
)(CreatePurchaseOrder);