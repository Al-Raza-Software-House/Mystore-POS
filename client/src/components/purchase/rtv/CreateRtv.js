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
import { useSelector } from 'react-redux';
import ItemPicker from '../../library/ItemPicker';
import moment from 'moment';
import CheckboxInput from '../../library/form/CheckboxInput';
import DateTimeInput from '../../library/form/DateTimeInput';
import SelectInput from '../../library/form/SelectInput';
import RtvItemRow from './RtvItemRow';
import UploadFile from '../../library/UploadFile';
import { updateSupplier } from '../../../store/actions/supplierActions';
import { itemsStampChanged, syncItems } from '../../../store/actions/itemActions';
import { addNewRtv } from '../../../store/actions/rtvActions';
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

const formName = "createRtv";

function CreateRtv(props) {
  const history = useHistory();
  const classes = useStyles();
  const { dispatch, storeId, lastEndOfDay, handleSubmit, pristine, submitSucceeded, submitting, error, invalid, dirty, printRtv} = props;
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/purchase/rtvs/new", 'title' : "New RTV" });
  }, []);

  const formValues = useSelector(state => {
    let formData = getFormValues(formName)(state);
    if(formData)
      return !formData.items ? { ...formData, items: []} : formData;
    else
      return { items: [] }
  });
  const { supplierId, grnId } = formValues;
  const values = formValues.items;
  const supplier = useSelector(state => state.suppliers[storeId] ? state.suppliers[storeId].find(record => record._id === supplierId) : null);
  const allItems = useSelector(state => state.items[storeId].allItems );
  
  const [items, setItems] = useState([]);//selected items
  const [grns, setGrns] = useState([]); //

  useEffect(() => {
    if(!supplierId)
    {
      dispatch( change(formName, 'grnId', 0) )
      setGrns(prevGrns => prevGrns.length ? [] : prevGrns);
      return;
    }
    dispatch( showProgressBar() );
    const controller = new AbortController();
    axios.get('/api/grns', { signal: controller.signal, params: { storeId, supplierId } }).then(({ data }) => {
    dispatch( hideProgressBar() );

      setGrns(data.grns);
      dispatch( change(formName, 'grnId', 0) )
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
    return () => controller.abort()
  }, [supplierId, storeId, dispatch]);

  const grnOption = useMemo(() => {
    let options = [{ id: 0, title: supplierId && grns.length === 0 ? "No GRNs found, add item manually" : "Select a GRN or add item manually" }];
    if(!supplierId || grns.length === 0) return options;
    options = [...options, ...grns.map(option => ({ id: option._id, title: `GRN# ${option.grnNumber} - ${ moment(option.grnDate).format("DD MMMM") }` }))];
    return options;
  }, [grns, supplierId])

  const renderTimer = useRef();
  const lastGrn = useRef();

  useEffect(() => {
    if(typeof lastGrn.current !== 'undefined' && lastGrn.current === grnId) return;//grnId not changed, allitems changed by other device
    lastGrn.current = grnId;
    setItems([]);
    dispatch(change(formName, 'items', undefined));
    if(!grnId) return;
    let grn = grns.find(record => record._id === grnId);
    if(!grn) return;
    let newItems = [];
    for(let index = 0; index< grn.items.length; index++)
    {
      let record = grn.items[index];
      let item = allItems.find(elem => elem._id === record._id);
      if(!item) continue;
      let { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, costPrice, salePrice, currentStock, packParentId, packQuantity, packSalePrice, batches } = item;
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
      let newItem = { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, costPrice, salePrice, currentStock, packParentId, packQuantity, packSalePrice, lowStock, overStock, quantity: 1, batches };
      dispatch( change(formName, `items[${_id}]`, {_id, currentStock, packQuantity, sourceBatches: batches, packParentId: item.packParentId, costPrice: record.costPrice, quantity: record.quantity, adjustment: record.adjustment, tax: record.tax, notes: "", batches:[{ batchNumber: 0, batchQuantity: 0 }] }));
      newItems.push(newItem);
    }
    renderTimer.current = setTimeout(() => setItems(newItems), 20); 
    return () => renderTimer.current && clearTimeout(renderTimer.current);
  }, [grnId, dispatch, grns, allItems])

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
      let { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, costPrice, salePrice, currentStock, packParentId, packQuantity, packSalePrice, batches } = item;
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
      let newItem = { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, costPrice, salePrice, currentStock, packParentId, packQuantity, packSalePrice, lowStock, overStock, quantity: 1, batches };
      dispatch( change(formName, `items[${_id}]`, {_id, currentStock, packQuantity, sourceBatches: batches, packParentId: item.packParentId,  costPrice, quantity: 1, adjustment: 0, tax: 0, notes: "", batches:[{ batchNumber: 0, batchQuantity: 0 }] }));
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
      rtvDate: moment().format("DD MMMM, YYYY hh:mm A"),
      grnId: 0
    }
    ));
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

  useEffect(() => {
    if(submitSucceeded)
      history.push('/purchase/rtvs');
  }, [submitSucceeded, history])

  const onSubmit = useCallback((formData, dispatch, { storeId, itemsLastUpdatedOn }) => {
    const payload = {storeId, ...formData};
    payload.rtvDate = moment(formData.rtvDate, "DD MMMM, YYYY hh:mm A").toDate();
    payload.items = [];
    items.forEach(item => {
      let record = formData.items[item._id];
      if(!record) return;
      let {_id, costPrice, quantity, adjustment, tax, notes, batches } = record;
      payload.items.push({_id, costPrice, quantity, adjustment, tax, notes, batches });
    });
    dispatch(showProgressBar());
    return axios.post('/api/rtvs/create', payload).then( response => {
      dispatch(hideProgressBar());
      if(response.data.rtv._id)
      {
        dispatch( syncItems(itemsLastUpdatedOn) );
        dispatch( itemsStampChanged(storeId, response.data.now) );
        dispatch( addNewRtv(storeId, response.data.rtv) );
        dispatch( showSuccess("New RTV added") );
        if(response.data.supplier)
          dispatch( updateSupplier(storeId, response.data.supplier._id, response.data.supplier, response.data.now, response.data.lastAction) );
        if(formData.printRtv)
          printRtv({ ...response.data.rtv, supplier });
      }

    }).catch(err => {
      dispatch(hideProgressBar());
      throw new SubmissionError({
        _error: err.response && err.response.data.message ? err.response.data.message: err.message
      });
    });
  }, [items, supplier, printRtv]);
    return(
      <>
      <Box width="100%" justifyContent="space-between" display="flex">
        <Typography gutterBottom variant="h6" align="center" style={{ flexGrow: 1 }}>
          Create New RTV
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
                options={grnOption}
                name="grnId"
                fullWidth={true}
                variant="outlined"
                margin="dense"
                disabled={!supplierId}
              />
            </Box>
            <Box width={{ xs: '100%', md: '32%' }}>
              <Field
              component={DateTimeInput}
              name="rtvDate"
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
                <Typography style={{ color: '#7c7c7c' }} align="center"> Add items manually or select GRN to create RTV </Typography>
                :
                <TableContainer style={{ overflowY:  "hidden" }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell style={{ minWidth: 20 }}></TableCell>
                        <TableCell style={{ minWidth: 280 }}>Item</TableCell>
                        <TableCell style={{ minWidth: 50 }} align="center">Stock</TableCell>
                        <TableCell style={{ minWidth: 70 }} align="center">Cost Price</TableCell>
                        <TableCell style={{ minWidth: 70 }} align="center">Return Quantity</TableCell>
                        <TableCell style={{ minWidth: 70 }} align="center">Amount</TableCell>
                        <TableCell style={{ minWidth: 40 }} align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {
                        items.map((item, index) => <RtvItemRow key={item._id} {...{ item, values, supplierId, removeItem }} /> )
                      }
                    </TableBody>
                  </Table>
                </TableContainer>
              }
            </Box>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box width={{ xs: '100%', md: '48%' }} display="flex" justifyContent="space-between" flexWrap="wrap">
              <Field
                component={UploadFile}
                storeId={storeId}
                label="Attachment"
                name="attachment"
                imageWidth={1920}
                disabled={!supplierId}
                fullWidth={true}
                filePath="rtvs/"
              />
            </Box>
            <Box width={{ xs: '100%', md: '48%' }} display="flex" justifyContent="space-between" flexWrap="wrap">
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
          
          <Box textAlign="center">
            <Field
              component={CheckboxInput}
              name="printRtv"
              label="Print RTV"
              fullWidth={true}
              disabled={pristine || submitting || invalid || !dirty}
            />
          </Box>

        <Box textAlign="center">
          <Button disableElevation type="submit" variant="contained" color="primary" disabled={pristine || submitting || invalid || !dirty || Number(totalQuantity) === 0} >
            Create RTV
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
  if(lastEndOfDay && moment(values.rtvDate, "DD MMMM, YYYY hh:mm A") <= moment(lastEndOfDay))
    errors.rtvDate = "Date & time should be after last day closing: " + moment(lastEndOfDay).format("DD MMMM, YYYY hh:mm A");
  else if(moment(values.rtvDate, "DD MMMM, YYYY hh:mm A") > moment())
    errors.rtvDate = "Date & time should not be after current time: " + moment().format("DD MMMM, YYYY hh:mm A");
  let itemsTotalQuantity = {}; //total quantity of single item, there can be multiple packings of same item selected in RTV so sum all of those quntities must be less than curren stock 
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
    let baseItemId = values.items[itemId].packParentId ? values.items[itemId].packParentId : values.items[itemId]._id;
    if(itemsTotalQuantity[baseItemId] === undefined) itemsTotalQuantity[baseItemId] = 0;
      
    let totalQuantity = values.items[itemId].packParentId ? Number(values.items[itemId].packQuantity) * quantity : quantity;
    itemsTotalQuantity[baseItemId] += totalQuantity;
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
    if(batchCount && batchQuantity !== quantity && !errors.items[itemId].batches._error) //batches applied but quantity doesn't match
      errors.items[itemId].batches._error = "Sum of batch quantities should be equal to total quantity";
    else if(batchCount === 0 && values.items[itemId].sourceBatches && values.items[itemId].sourceBatches.length > 0 && !errors.items[itemId].quantity)
      errors.items[itemId].quantity = "Please enter batch details";

  }
  //sum of qunatities of packs of same item should be less than current stock
  for(let baseItemId in itemsTotalQuantity)
  {
    //show error on base item
    if(values.items[baseItemId] && Number(values.items[baseItemId].currentStock) < itemsTotalQuantity[baseItemId]  && !errors.items[baseItemId].quantity)  errors.items[baseItemId].quantity = `sum of all pack quantities(${itemsTotalQuantity[baseItemId]}) should be less than current stock(${Number(values.items[baseItemId].currentStock)})`;
    
    //show error on packs
    for(let itemId in values.items)
    {
      if(values.items[itemId] === undefined) continue;
      if(values.items[itemId].packParentId === baseItemId && Number(values.items[itemId].currentStock) < itemsTotalQuantity[baseItemId] && !errors.items[itemId].quantity)
      {
        errors.items[itemId].quantity = `sum of all pack quantities(${itemsTotalQuantity[baseItemId]}) should be less than current stock(${Number(values.items[itemId].currentStock)})`;
      }
    }
  }
  return errors;
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  const store = state.stores.stores.find(store => store._id === storeId);
  const itemsLastUpdatedOn = state.system.lastUpdatedStamps[storeId] ? state.system.lastUpdatedStamps[storeId].items : null;
  return{
    storeId,
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
)(CreateRtv);