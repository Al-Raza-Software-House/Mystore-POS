import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
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
import { useSelector } from 'react-redux';
import ItemPicker from '../../library/ItemPicker';
import moment from 'moment';
import CheckboxInput from '../../library/form/CheckboxInput';
import DateTimeInput from '../../library/form/DateTimeInput';
import RtvItemRow from './RtvItemRow';
import UploadFile from '../../library/UploadFile';
import { updateRtv } from '../../../store/actions/rtvActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { updateSupplier } from '../../../store/actions/supplierActions';
import { itemsStampChanged, syncItems } from '../../../store/actions/itemActions';
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

const formName = "editRtv";

// merger rtv batches into item batches to create source batches to select from, Some batches in item can be deleted due to RTV, so re-create those
const mergeItemBatchesWithRTVBatches = (itemBatches, rtvBatches, packQuantity) => {
  let newBatches = Array.isArray(itemBatches) ? [...itemBatches] : [];
  if(!Array.isArray(rtvBatches) || rtvBatches.length === 0) return newBatches;
  rtvBatches.forEach(rtvBatch => {
    if(!rtvBatch.batchNumber || rtvBatch.batchQuantity === 0) return;
    let batchExist = newBatches.find(record => record.batchNumber.toLowerCase() === rtvBatch.batchNumber.toLowerCase());
    let batchQuantity = Number(packQuantity) * Number(rtvBatch.batchQuantity); //packQuantity = 1 in case of non-pack
    if(batchExist)
    {
      batchExist.batchStock = +(batchExist.batchStock + batchQuantity).toFixed(2);
      newBatches = newBatches.map( record => record.batchNumber.toLowerCase() === rtvBatch.batchNumber.toLowerCase() ? batchExist :  record);
    }else
    {
      newBatches.push({
        batchNumber: rtvBatch.batchNumber,
        batchExpiryDate: rtvBatch.batchExpiryDate,
        batchStock: +batchQuantity.toFixed(2)
      });
    }
  });
  return newBatches;
}

function EditRtv(props) {
  const history = useHistory();
  const { storeId, rtvId } = useParams();
  const { dispatch, lastEndOfDay, handleSubmit, pristine, submitSucceeded, submitting, error, invalid, dirty, printRtv} = props;
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/purchase/rtvs/edit", 'title' : "Edit RTV" });
  }, []);

  const rtv  = useSelector(state => {
    let rtvs = state.rtvs[storeId] ? state.rtvs[storeId].records : [];
    return rtvs.find(record => record._id === rtvId);
  })
  const beforeLastEndOfDay = useMemo(() => {
    if(!rtv) return;
    return lastEndOfDay && moment(rtv.rtvDate) <= moment(lastEndOfDay);
  }, [rtv, lastEndOfDay]);

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
  const [grn, setGrn] = useState(null);
  const renderTimer = useRef();
  const pageInitialized = useRef();
  useEffect(() => {
    if(pageInitialized.current) return; //run only once at page load
    pageInitialized.current = true;
    if(!rtv) return;
    let formItems = {};
    rtv.items.forEach(item => {
      let batches = [];
      item.batches.forEach( (batch, index) => {
        if(!batch.batchNumber) return;
        batches.push({
          batchNumber: `${batch.batchNumber}----${batch.batchExpiryDate}`,
          batchQuantity: batch.batchQuantity
        })
      })
      if(item.batches.length === 0)
       batches.push({
         batchNumber: 0,
         batchQuantity: 0
       });
      formItems[item._id] = {...item, batches};
    })
    
    let selectedItems = [];
    rtv.items.forEach(item => {
      
      let storeItem = allItems.find(record => record._id === item._id);
      if(storeItem)
      {
        let { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, currentStock, packParentId, packQuantity, salePrice, packSalePrice, minStock, maxStock } = storeItem;
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
        let originalBatches = mergeItemBatchesWithRTVBatches(storeItem.batches, item.batches, storeItem.packParentId ? storeItem.packQuantity : 1 );
        let newItem = { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, costPrice: item.costPrice, salePrice, currentStock, packParentId, packQuantity, packSalePrice, lowStock, overStock, quantity: item.quantity, batches: originalBatches, minStock, maxStock };
        formItems[item._id] = { ...formItems[item._id], currentStock, packQuantity, sourceBatches: originalBatches, packParentId: storeItem.packParentId, };
        selectedItems.push(newItem);
      }
    });
    dispatch(initialize(formName, { ...rtv, items: formItems, rtvDate: moment(rtv.rtvDate).format("DD MMMM, YYYY hh:mm A") }));
    renderTimer.current = setTimeout(() => setItems(selectedItems), 10);
    if(!rtv.grnId) return;
    const controller = new AbortController();
    axios.get('/api/grns/', { signal: controller.signal, params: { storeId, supplierId: rtv.supplierId, grnId: rtv.grnId } }).then(({ data }) => {
      if(data.grn._id)
        setGrn(data.grn);
    }).catch(err => {
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    });

    return () => {
      controller.abort();
      renderTimer.current && clearTimeout(renderTimer.current);
    }
  }, [rtv, allItems, dispatch, storeId]);

  const getItemLastCost = useCallback((itemId) => {
    axios.get('/api/grns/lastCost', { params: { storeId, itemId } }).then(({ data }) => {
      if(data.lastCost)
        dispatch( change(formName, `items[${itemId}].costPrice`, data.lastCost) );
    }).catch(err => { 

    })
  }, [storeId, dispatch]);

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
      let { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, costPrice, salePrice, currentStock, packParentId, packQuantity, packSalePrice, batches, minStock, maxStock } = item;
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
      let newItem = { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, costPrice, salePrice, currentStock, packParentId, packQuantity, packSalePrice, lowStock, overStock, quantity: 1, batches, minStock, maxStock };
      dispatch( change(formName, `items[${_id}]`, {_id, currentStock, packQuantity, sourceBatches: batches, packParentId: item.packParentId,  costPrice, quantity: 1, adjustment: 0, tax: 0, notes: "", batches:[{ batchNumber: 0, batchQuantity: 0 }] }));
      setItems([
        newItem,
        ...items
      ]);
      getItemLastCost(_id);
    }
  }, [items, values, allItems, dispatch, getItemLastCost]);

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

  useEffect(() => {
    if(submitSucceeded)
      history.push('/purchase/rtvs');
  }, [submitSucceeded, history])

  const onSubmit = useCallback((formData, dispatch, { match, itemsLastUpdatedOn }) => {
    const payload = {...match.params, ...formData};
    payload.rtvDate = moment(formData.rtvDate, "DD MMMM, YYYY hh:mm A").toDate();
    payload.items = [];
    items.forEach(item => {
      let record = formData.items[item._id];
      if(!record) return;
      let {_id, costPrice, quantity, adjustment, tax, notes, batches } = record;
      payload.items.push({_id, costPrice, quantity, adjustment, tax, notes, batches });
    });
    dispatch(showProgressBar());
    return axios.post('/api/rtvs/update', payload).then( response => {
      dispatch(hideProgressBar());
      if(response.data.rtv._id)
      {
        dispatch( syncItems(itemsLastUpdatedOn) );
        dispatch( itemsStampChanged(match.params.storeId, response.data.now) );
        dispatch( updateRtv(match.params.storeId, match.params.rtvId, response.data.rtv) );
        if(response.data.supplier)
          dispatch( updateSupplier(match.params.storeId, response.data.supplier._id, response.data.supplier, response.data.now, response.data.lastAction) );
        dispatch( showSuccess("RTV updated") );
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

  if(!rtvId || !rtv)
  {
    dispatch(showError("Record not found"));
    return <Redirect to="/purchase/rtvs" />
  }

    return(
      <>
      <Box width="100%" justifyContent="space-between" display="flex">
        <Typography gutterBottom variant="h6" align="center" style={{ flexGrow: 1 }}>
          Update RTV
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
                !grn ? null :
                <Typography style={{ color: '#7c7c7c' }} align="center"> { `GRN# ${grn.grnNumber} - ${ moment(grn.grnDate).format("DD MMMM, YYYY") }` } </Typography>
              }
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
              disabled={beforeLastEndOfDay}
              />    
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
                        items.map((item, index) => <RtvItemRow key={item._id} {...{ item, values, supplierId, removeItem, beforeLastEndOfDay }} /> )
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
                disabled={beforeLastEndOfDay}
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
                disabled={beforeLastEndOfDay}
              />
            </Box>
          </Box>
          
          <Box textAlign="center">
            <Field
              component={CheckboxInput}
              name="printRtv"
              label="Print RTV"
              fullWidth={true}
              disabled={!dirty}
            />
          </Box>

        <Box textAlign="center">
          <Button disableElevation type="submit" variant="contained" color="primary" disabled={beforeLastEndOfDay || pristine || submitting || invalid || !dirty || Number(totalQuantity) === 0} >
            Update RTV
          </Button>
          {
            dirty ? null :
            <IconButton style={{ marginLeft: 8}} title="Print GRN" onClick={ () => printRtv({ ...rtv, supplier}) } >
              <FontAwesomeIcon icon={faPrint} size="xs" />
            </IconButton>
          }
          {
            beforeLastEndOfDay ?
            <Typography component="div" style={{ color: '#7c7c7c', marginTop: 10, marginBottom: 10 }}>Cannot update this RTV because it is dated before Last end of Day: { moment(lastEndOfDay).format("DD MMM, YYYY, hh:mm A") }</Typography>
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
  if(lastEndOfDay && moment(values.rtvDate, "DD MMMM, YYYY hh:mm A") <= moment(lastEndOfDay))
    errors.rtvDate = "Date & time should be after last day closing: " + moment(lastEndOfDay).format("DD MMMM, YYYY hh:mm A");
  else if(moment(values.rtvDate, "DD MMMM, YYYY hh:mm A") > moment())
    errors.rtvDate = "Date & time should not be after current time: " + moment().format("DD MMMM, YYYY hh:mm A"); 
  
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
      batchCount++;
      batchQuantity += Number(batch.batchQuantity);
    });
    if(batchCount && batchQuantity !== quantity && !errors.items[itemId].batches._error) //batches applied but quantity doesn't match
    {
      errors.items[itemId].batches._error = "Sum of batch quantities should be equal to total quantity";
      if(!errors.items[itemId].quantity) errors.items[itemId].quantity = "Batches quantity doesn't match";
    }
    else if(batchCount === 0 && values.items[itemId].sourceBatches && values.items[itemId].sourceBatches.length > 0 && !errors.items[itemId].quantity)
      errors.items[itemId].quantity = "Please enter batch details";
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
)(EditRtv);