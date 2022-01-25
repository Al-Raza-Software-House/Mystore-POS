import React, { useState, useEffect } from 'react';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, CircularProgress, makeStyles, Dialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core';
import { connect } from 'react-redux';
import { change, Field, initialize, reduxForm, SubmissionError } from 'redux-form';
import TextInput from '../../../library/form/TextInput';
import AutoComplete from '../../../library/form/AutoComplete';
import FormMessage from '../../../library/FormMessage';
import axios from 'axios';
import { showSuccess } from '../../../../store/actions/alertActions';
import { createSupplier } from '../../../../store/actions/supplierActions';

function SelectSupplier(props) {
  const { storeId, formName, suppliers, disabled=false, showError=true, addNewRecord=true } = props;
  return(
    <>
    <Box display="flex">
      <Field
        component={AutoComplete}
        options={suppliers}
        getOptionLabel={(option) => option && option.name ? option.name : ""}
        label="Select Supplier"
        id="supplier-id"
        name="supplierId"
        placeholder="Select supplier"
        fullWidth={true}
        style={{ flexGrow: 1 }}
        disabled={disabled}
        showError={showError}
        addNewRecord={addNewRecord}
      />
      { addNewRecord && <AddSupplierForm disabled={disabled} storeId={storeId} formName={formName} /> }
    </Box>
    
    </>
  )
}

const mapStateToProps = state => {
  return {
    storeId: state.stores.selectedStoreId,
    suppliers: state.suppliers[state.stores.selectedStoreId] ? state.suppliers[state.stores.selectedStoreId] : []
  }
}

export default connect(mapStateToProps)(SelectSupplier);

const useStyles = makeStyles(theme => ({
  startIcon: {
    marginRight: 0
  },
  actionButton:{
    marginTop: 8,
    marginBottom: 4, 
    paddingLeft: 0, 
    paddingRight: 0, 
    minWidth: 40,
    width: 40,
    height: 40,
    borderLeft: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0
  }
}))

function AddSupplier(props){
  const { handleSubmit, disabled, pristine, dispatch, submitSucceeded, submitting, error, invalid } = props;
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const handleClose = () => setOpen(false);

  const submitForm = (event) => {
    event.stopPropagation();
    handleSubmit(event);
  }

  useEffect(() => {
    if(submitSucceeded)
    {
      dispatch( initialize('createSupplier', {}) );
      setOpen(false);
    }
  }, [submitSucceeded, dispatch])

  return(
    <>
    <Button 
      type="button"
      disabled={disabled}
      title="Add new supplier"
      onClick={() => setOpen(true)}
      classes={{ root: classes.actionButton, startIcon: classes.startIcon }}
      disableElevation  startIcon={ <FontAwesomeIcon icon={faPlus} size="xs" /> } size="small" edge="end" variant="outlined">
    </Button>
    <Dialog open={open} fullWidth onClose={handleClose} aria-labelledby="form-dialog-title">
      <DialogTitle style={{ textAlign: 'center' }}>Add New Supplier</DialogTitle>
      <form onSubmit={submitForm}>
        <DialogContent>
          <Box>
            <Field
            component={TextInput}
            id="name"
            name="name"
            label="Supplier Name"
            placeholder="Supplier name..."
            fullWidth={true}
            variant="outlined"
            autoFocus={true}
            />    
          </Box>

          <Box px={2} display="flex" justifyContent="center" alignItems="center">
            <Button disableElevation type="submit"  color="primary" variant="contained" disabled={pristine || submitting || invalid}>
              Add { submitting && <CircularProgress style={{ marginLeft: 8 }} size={24} /> }
            </Button>
          </Box>
          <Box px={2} display="flex" justifyContent="center" alignItems="center">
            <FormMessage error={true} style={{visibility: !submitting && error ? 'visible' : 'hidden' }}>
              { error ? error : 'invalid request' }
            </FormMessage>  
          </Box>
          
        </DialogContent>
      </form>
      <DialogActions style={{ justifyContent: 'center' }}>
        <Button disableElevation type="button" onClick={handleClose} color="primary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
    </>
  )
}

const onSubmit = (values, dispatch, { storeId, formName }) => {
  return axios.post('/api/suppliers/create', {storeId, ...values}).then( response => {
    if(response.data.supplier._id)
    {
      dispatch( createSupplier(storeId, response.data.supplier, response.data.now, response.data.lastAction) );
      dispatch( change(formName, 'supplierId', response.data.supplier._id) );
      dispatch( showSuccess("New supplier created") );
    }

  }).catch(err => {
    throw new SubmissionError({
      _error: err.response && err.response.data.message ? err.response.data.message: err.message
    });
  });
}

const validate = (values, props) => {
  const { dirty } = props;
  if(!dirty) return {};
  const errors = {};
  if(!values.name)
   errors.name = "Supplier name is required";
  return errors;
}


const AddSupplierForm = reduxForm({
  'form': 'createSupplier',
  validate,
  onSubmit,
  initialValues: {}
})(AddSupplier);
