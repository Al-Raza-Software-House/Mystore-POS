import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { makeStyles, Button, Box, Typography, FormHelperText, TableContainer, Table, TableHead, TableBody, TableRow, TableCell } from '@material-ui/core'
import { change, Field, getFormValues, initialize, reduxForm } from 'redux-form';
import { useSelector } from 'react-redux';
import ItemPicker from '../../library/ItemPicker';
import ReactGA from "react-ga4";
import BarcodeItemRow from './BarcodeItemRow';
import PrintBarcodes from './PrintBarcodes';
import SelectSupplier from 'components/stock/items/itemForm/SelectSupplier';
import SelectInput from 'components/library/form/SelectInput';
import moment from 'moment';
import axios from 'axios';
import { hideProgressBar, showProgressBar } from 'store/actions/progressActions';
import { showError } from 'store/actions/alertActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUndo } from '@fortawesome/free-solid-svg-icons';

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
const formName = "printBarcodes";
const formSelector = getFormValues(formName);

function GenerateBarcodes(props) {
  const classes = useStyles();
  const { dispatch, pristine, submitting, error, invalid, dirty} = props;
  const values = useSelector(state => {
    let records = formSelector(state);
    return records ? records : { items: [] };
  });
  const { supplierId, grnId } = values;
  const [printData, setPrintData] = useState(null);
  
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/purchase/barcodes", 'title' : "Print Barcodes" });
  }, []);

  const [items, setItems] = useState([]);
  const [grns, setGrns] = useState([]); //
  const allItems = useSelector(state => state.items[ state.stores.selectedStoreId ].allItems );
  const storeId = useSelector(state => state.stores.selectedStoreId );

  const grnOption = useMemo(() => {
    let options = [{ id: 0, title: supplierId && grns.length === 0 ? "No GRNs found, add item manually" : "Select a GRN or add item manually" }];
    if(!supplierId || grns.length === 0) return options;
    options = [...options, ...grns.map(option => ({ id: option._id, title: `GRN# ${option.grnNumber} - ${ moment(option.grnDate).format("DD MMMM") }` }))];
    return options;
  }, [grns, supplierId]);

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
      let { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, salePrice, packParentId, packQuantity, packSalePrice } = item;
      let newItem = { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, salePrice, packParentId, packQuantity, packSalePrice, quantity: 1 };
      dispatch( change(formName, `items[${_id}]`, {_id, quantity: record.quantity }));
      newItems.push(newItem);
    }
    renderTimer.current = setTimeout(() => setItems(newItems), 20); 
    return () => renderTimer.current && clearTimeout(renderTimer.current);
  }, [grnId, dispatch, grns, allItems])

  const selectItem = useCallback((item) => {
    let isExist = items.find(record => record._id === item._id);
    if(isExist)
    {
      dispatch( change(formName, `items[${item._id}].quantity`, Number(values.items[item._id].quantity) + 1));
      let newItems = items.filter(record => record._id !== item._id);
      newItems.unshift(isExist);
      setItems(newItems);
    }else
    {
      let { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, salePrice,  packParentId, packQuantity, packSalePrice } = item;
      let newItem = { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, salePrice, packParentId, packQuantity, packSalePrice, quantity: 1 };
      dispatch( change(formName, `items[${_id}]._id`, _id));
      dispatch( change(formName, `items[${_id}].quantity`, 1));
      setItems([
        newItem,
        ...items
      ]);
    }
  }, [items, values, dispatch]);

  const removeItem = useCallback((item) => {
    dispatch( change(formName, `items[${item._id}]`, ""));
    setItems(prevItems => prevItems.filter(record => record._id !== item._id));
  }, [dispatch]);

  useEffect(() => {
    dispatch(initialize(formName, {}));
  }, [dispatch]);

  const totalQuantity = useMemo(() => {
    let total = 0;
    for(let key in values.items)
    {
      let item = values.items[key];
      if(!item) continue;
      if(isNaN(item.quantity))
        total += 0
      else
        total += Number(item.quantity);
    }
    return (+total.toFixed(2)).toLocaleString()
  }, [values]);

  const anyZeroQuantity = useMemo(() => {
    for(let key in values.items)
    {
      let item = values.items[key];
      if(!item) continue;
      let quantity = isNaN(item.quantity) ? 0 :  Number(item.quantity);
      if(quantity === 0) return true; 
    }
    return false;
  }, [values]);

  const generateBarcodes = useCallback(() => {
    setPrintData(values);
  }, [values]);

  const resetForm = useCallback(() => {
    setItems([]);
    dispatch( initialize(formName, {}) );
  }, [dispatch]);
  
    return(
      <>
      <PrintBarcodes data={printData} items={items} setData={setPrintData} />
      <Box width="100%" justifyContent="space-between" display="flex">
        <Typography gutterBottom variant="h6" align="center" style={{ flexGrow: 1 }}>
          Print Barcodes
        </Typography>
      </Box>
      <Box width="100%" justifyContent="space-between" display="flex">
        <Typography style={{ color: '#7c7c7c' }}> Supported Label Size: 50mm X 25mm (2 column)</Typography>
        <Typography style={{ color: '#7c7c7c' }}> Supported Printer: TSC TTP-244 Pro </Typography>
      </Box>
      <Box margin="auto" width="100%">
        
        <form>
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
            <Box width={{ xs: '100%', md: '32%' }} pt={1} textAlign="right">
              <Button color="primary" variant="outlined" onClick={resetForm} endIcon={<FontAwesomeIcon size='xs' icon={faUndo}/>}>Reset</Button>
            </Box>
          </Box>
          <Box display="flex" justifyContent="space-between" flexWrap="wrap" alignItems="center">
            <Box width={{ xs: '100%', md: '50%' }}>
              <ItemPicker {...{selectItem, removeItem, selectedItems: items}} />
            </Box>
            <Box width={{ xs: '100%', md: '25%' }}>
              <Typography align="center">Total Items: <b>{ items.length }</b></Typography>
            </Box>
            <Box width={{ xs: '100%', md: '25%' }}>
              <Typography align="center">Total Quantity: <b>{ totalQuantity }</b></Typography>
            </Box>
          </Box>
          <Box style={{ backgroundColor: '#ececec' }} p={1} borderRadius={6} my={1}>
            <Box style={{ backgroundColor: '#fff' }} p={ items.length === 0 ? 5 : 0 }>
              {
                items.length === 0 ?
                <Typography style={{ color: '#7c7c7c' }} align="center"> Select items to print their barcodes </Typography>
                :
                <TableContainer style={{ overflowY:  "hidden" }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell style={{ minWidth: 280 }}>Item</TableCell>
                        <TableCell style={{ minWidth: 70 }} align="center">Quantity</TableCell>
                        <TableCell style={{ minWidth: 40 }} align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {
                        items.map((item, index) => (
                          <BarcodeItemRow key={item._id} item={item} formName={formName} removeItem={removeItem} />
                        ))
                      }
                    </TableBody>
                  </Table>
                </TableContainer>
              }
            </Box>
          </Box>

        <Box textAlign="center" mt={3}>
          <Button disableElevation onClick={generateBarcodes} type="button" variant="contained" color="primary" disabled={pristine || invalid || !dirty || Number(totalQuantity) === 0} >
            Generate Barcodes
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
            <Typography style={{ color: '#7c7c7c' }}>Items with zero quantity will not be printed</Typography>  
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
  return errors;
}



export default 
reduxForm({
  'form': formName,
  validate
})(GenerateBarcodes);