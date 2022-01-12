import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCalendarAlt, faPlus } from '@fortawesome/free-solid-svg-icons';
import { IconButton, CircularProgress, FormHelperText, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box } from '@material-ui/core';
import { connect } from 'react-redux';
import { showError, showSuccess } from '../../../store/actions/alertActions';
import { updateItem } from '../../../store/actions/itemActions';
import axios from 'axios';
import { Field, FieldArray, initialize, reduxForm, SubmissionError } from 'redux-form';
import { compose } from 'redux';
import TextInput from '../../library/form/TextInput';
import { useCallback } from 'react';
import DateInput from 'components/library/form/DateInput';
import { allowOnlyPostiveNumber } from 'utils';

const formName = "adjustBatchStock";

function AdjustBatchStock(props){
  const [open, setOpen] = useState(false);
  const { showError, dispatch, item  } = props;
  const { error, invalid, pristine, submitting, submitSucceeded, handleSubmit } = props;
  useEffect(() => {
    if(submitSucceeded)
    {
      handleClose();
    }
  }, [submitSucceeded])

  const handleClickOpen = useCallback(() => {
    if(item)
    {
      setOpen(true); 
      dispatch( initialize(formName, { itemId: item._id, batches: item.batches.length ? item.batches : [{ batchNumber: "", batchExpiryDate: null, batchStock: 0 }], currentStock: item.currentStock }) );
    }else
    {
      showError("Item Not found");
    }
  }, [item, dispatch, showError])

  const handleClose = () => {
    setOpen(false);
  };


  return (
    <>
      <IconButton onClick={(event) => handleClickOpen(event) } title="Adjust Batch Stock">
        <FontAwesomeIcon icon={faCalendarAlt} size="xs" />
      </IconButton>
      {
        !item ? null :
        <Dialog fullWidth={true} maxWidth="sm" onClose={handleClose} aria-labelledby="customized-dialog-title" open={open}>
          <DialogTitle disableTypography  id="customized-dialog-title" onClose={handleClose}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" style={{ flexGrow: 1}}>Adjust Batch Stock</Typography>
              <IconButton onClick={handleClose} style={{ width: 30, height: 30 }}>
                <FontAwesomeIcon icon={faTimes}  size="xs" />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers >
            <form onSubmit={handleSubmit}>
              <Box>
                <Typography variant="h6" gutterBottom align="center">{ item.itemName }</Typography>
                <Typography style={{ color: "#6c6a6a" }} gutterBottom align="center"> Current Stock: { item.currentStock.toLocaleString() } units</Typography>
                <FieldArray name="batches" component={ItemBatches}  />
                
                <Box textAlign="center" mt={1} >
                  <Button disableElevation type="submit" variant="contained" color="primary" disabled={pristine || submitting || invalid } >
                    Adjust Batch Stock
                    { submitting && <CircularProgress  size={20} style={{ marginLeft: 15 }} /> }
                  </Button>
                  {  
                    <FormHelperText error={true}   style={{textAlign: 'center', visibility: !submitting && error ? 'visible' : 'hidden' }}>
                      <Typography component="span">{ error ? error : 'invalid request' }</Typography>
                    </FormHelperText>  
                  }
                </Box>

              </Box>
            </form>
            
          </DialogContent>
          <DialogActions>
            <Button autoFocus onClick={handleClose} color="primary">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      }
    </>
  )
}

function ItemBatches({ fields, meta }){
  const { error } = meta;
  return(
    <>
    {
      fields.map( (batch, index) => (
      <Box width="100%" display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" key={index}>
        <Box width={{ xs: '100%', md: '25%' }}>
          <Field
            component={TextInput}
            label="Batch No."
            name={`${batch}.batchNumber`}
            placeholder="Batch No..."
            fullWidth={true}
            variant="outlined"
            margin="dense"
            type="text"
            showError={false}
          />
        </Box>
        <Box width={{ xs: '100%', md: '30%' }}>
          <Field
            component={DateInput}
            dateFormat="DD MMM, YYYY"
            label="Expiry Date."
            name={`${batch}.batchExpiryDate`}
            placeholder="Expiry Date..."
            fullWidth={true}
            inputVariant="outlined"
            margin="dense"
            type="text"
          />
        </Box>
        <Box width={{ xs: '100%', md: '25%' }}>
          <Field
            component={TextInput}
            label="Batch Stock"
            name={`${batch}.batchStock`}
            placeholder="Batch Stock..."
            fullWidth={true}
            variant="outlined"
            margin="dense"
            type="text"
            showError={false}
            onKeyDown={allowOnlyPostiveNumber}
          />
        </Box>
        <Box width={{ xs: '100%', md: '10%' }}>
          {
            index === 0 ?
            <IconButton onClick={() => fields.push({ batchNumber: "", batchExpiryDate: null, batchStock: 0 })} title="Add another batch">
              <FontAwesomeIcon icon={faPlus} size="xs"  />
            </IconButton>
            :
            <IconButton onClick={() => fields.remove(index)} title="Remove this batch">
              <FontAwesomeIcon icon={faTimes} size="xs"  />
            </IconButton>
          }
        </Box>
      </Box>
      ))
    }
    <Box mt={1} textAlign="center" width="100%">
        <FormHelperText error={error ? true : false} style={{ textAlign: "center" }}>
          { error ? error: <span>&nbsp;</span>}
        </FormHelperText>
      </Box>
    </>
  )
}

const onSubmit = (values, dispatch, { storeId, itemId }) => {
  return axios.post('/api/items/adjustBatchStock', {storeId, itemId, ...values }).then( response => {
    if(response.data.item._id)
    {
      response.data.item.variants = [];
      response.data.item.packings = [];
      if(response.data.packings)
      response.data.item.packings = response.data.packings;

      dispatch( updateItem(storeId, itemId,  response.data.item, response.data.now, response.data.lastAction, []) );
      dispatch( showSuccess("Batch stock adjusted") );
    }

  }).catch(err => {
    throw new SubmissionError({
      _error: err.response && err.response.data.message ? err.response.data.message: err.message
    });
  });
}


const validate = (values, props) => {
  if(!values.batches) return {};
  const errors = { batches: {} };
  let batchStock = 0;
  let batchCount = 0;
  values.batches.forEach((batch, index) => {
    if(!batch.batchNumber) return;
    if(!Number(batch.batchStock)) errors.batches._error = "Batch quantity is required";
    if(!batch.batchExpiryDate) errors.batches._error = "Batch expiry date is required";
    batchCount++;
    batchStock += Number(batch.batchStock);
  });
  if(batchCount && batchStock !== Number(values.currentStock) && !errors.batches._error) //batches applied but quantity doesn't match
      errors.batches._error = `Sum of batch stock(${batchStock}) should be equal to current stock(${values.currentStock})`;
  return errors;
}

const mapStateToProps = (state, props) => {
  const storeId = state.stores.selectedStoreId;
  const allItems = state.items[storeId] ? state.items[storeId].allItems : [];
  const item = allItems.find(item => item._id === props.itemId)
  return{
    item
  }
}

export default compose(
  connect(mapStateToProps, { showError }),
  reduxForm({
    'form': formName,
    validate,
    onSubmit
  })
)(AdjustBatchStock);