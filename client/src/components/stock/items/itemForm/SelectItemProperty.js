import React, { useState, useEffect } from 'react';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, CircularProgress, makeStyles, Dialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core';
import { useSelector } from 'react-redux';
import { change, Field, initialize, reduxForm, SubmissionError } from 'redux-form';
import TextInput from '../../../library/form/TextInput';
import AutoComplete from '../../../library/form/AutoComplete';
import FormMessage from '../../../library/FormMessage';
import axios from 'axios';
import { showSuccess } from '../../../../store/actions/alertActions';
import { updateItemProperties } from '../../../../store/actions/itemPropertiesActions';

function SelectItemProperty(props) {
  const { formName, propertyId, disabled=false, addNewRecord=true } = props;
  const { storeId, itemProperties } = useSelector(state => {
    let storeId = state.stores.selectedStoreId;
    return {
      storeId,
      itemProperties: state.itemProperties[storeId] ? state.itemProperties[storeId] : {}
    }
  })  
  return(
    <>
    <Box display="flex">
      <Field
        component={AutoComplete}
        options={itemProperties[propertyId].values}
        getOptionLabel={(option) => option && option.title ? option.title : ""}
        label={itemProperties[propertyId].name}
        id={propertyId}
        name={`itemPropertyValues.${propertyId}`}
        placeholder={itemProperties[propertyId].name}
        fullWidth={true}
        style={{ flexGrow: 1 }}
        disabled={disabled}
        addNewRecord={addNewRecord}
      />
      { addNewRecord && <AddItemPropertyForm disabled={disabled} storeId={storeId} propertyId={propertyId} propertyName={itemProperties[propertyId].name} formName={formName} /> }
    </Box>
    
    </>
  )
}

export default SelectItemProperty;

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

function AddItemProperty(props){
  const { handleSubmit, disabled, propertyName, pristine, dispatch, submitSucceeded, submitting, error, invalid } = props;
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
      dispatch( initialize('addItemProperty', {}) );
      setOpen(false);
    }
  }, [submitSucceeded, dispatch])

  return(
    <>
    <Button 
      type="button"
      disabled={disabled}
      title="Add new property value"
      onClick={() => setOpen(true)}
      classes={{ root: classes.actionButton, startIcon: classes.startIcon }}
      disableElevation  startIcon={ <FontAwesomeIcon icon={faPlus} size="xs" /> } size="small" edge="end" variant="outlined">
    </Button>
    <Dialog open={open} fullWidth onClose={handleClose} aria-labelledby="form-dialog-title">
      <DialogTitle style={{ textAlign: 'center' }}>Add New {propertyName}</DialogTitle>
      <form onSubmit={submitForm}>
        <DialogContent>
          <Box>
            <Field
            component={TextInput}
            name="title"
            label={propertyName}
            placeholder={propertyName}
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

const onSubmit = (values, dispatch, { storeId, propertyId, formName }) => {
  return axios.post('/api/itemProperties/addPropertyValue', {storeId, propertyId, ...values}).then( response => {
    if(response.data._id)
    {
      const values = response.data[propertyId].values;
      dispatch( updateItemProperties(storeId, response.data) );
      dispatch( change(formName, propertyId, values[values.length - 1]._id ) );
      dispatch( showSuccess("New property value added") );
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
  if(!values.title)
   errors.title = "Value is required";
  return errors;
}


const AddItemPropertyForm = reduxForm({
  'form': 'addItemProperty',
  validate,
  onSubmit,
  initialValues: {}
})(AddItemProperty);
