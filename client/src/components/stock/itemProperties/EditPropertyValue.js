import React, { useEffect, useState } from 'react';
import { Box, Dialog, DialogActions, DialogTitle, DialogContent, Button, CircularProgress, IconButton } from '@material-ui/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { reduxForm, SubmissionError, Field, initialize  } from 'redux-form';
import axios from 'axios';
import { showSuccess } from '../../../store/actions/alertActions';
import TextInput from '../../library/form/TextInput';
import FormMessage from '../../library/FormMessage';
import { updateItemProperties } from '../../../store/actions/itemPropertiesActions';

function EditPropertyValue(props){
  const { dispatch, value, propertyName, handleSubmit, pristine, submitting, submitSucceeded, error, invalid } = props;
  const [open, setOpen] = useState(false);

  const handleClose = () => { 
    setOpen(false);
  }

  const editRecord = () => {
    dispatch( initialize('editPropertyValue', value) );
    setOpen(true);
  }

  useEffect(() => {
    if(submitSucceeded)
    {
      setOpen(false);
    }
  }, [submitSucceeded])

  return(
  <>
    <IconButton edge="end" style={{ fontSize: 18 }} onClick={editRecord}>
      <FontAwesomeIcon icon={faPencilAlt} size="sm" />
    </IconButton>
    
    <Dialog open={open} fullWidth onClose={handleClose} aria-labelledby="form-dialog-title">
      <DialogTitle style={{ textAlign: 'center' }}>Update { propertyName }</DialogTitle>
      <form onSubmit={handleSubmit} >
        <DialogContent>
          
          <Box>
            <Field
              component={TextInput}
              name="title"
              label={propertyName}
              variant="outlined"
              fullWidth={true}
              autoFocus={true}
              placeholder={propertyName + '...'}
            />
          </Box> 

          <Box px={2} display="flex" justifyContent="center" alignItems="center">
            <Button disableElevation type="submit"  color="primary" variant="contained" disabled={pristine || submitting || invalid}>
              Update { submitting && <CircularProgress style={{ marginLeft: 8 }} size={24} /> }
            </Button>
          </Box>
          <Box px={2} display="flex" justifyContent="center" alignItems="center">
            <FormMessage error={true} style={{visibility: !submitting && error ? 'visible' : 'hidden' }}>
              { error ? error : 'invalid request' }
            </FormMessage>  
          </Box>
        </DialogContent>
        <DialogActions style={{ justifyContent: 'center' }}>
          <Button disableElevation type="button" onClick={handleClose} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  </>
  )
}


const onSubmit = (values, dispatch, { storeId, propertyId, value }) => {
  let data = {
    storeId,
    propertyId,
    valueId: value._id,
    title: values.title
  }
  return axios.post('/api/itemProperties/editPropertyValue', data).then( response => {
    if(response.data._id)
    {
      dispatch( updateItemProperties(storeId, response.data) );
      dispatch( showSuccess("Value updated") );
    }

  }).catch(err => {
    throw new SubmissionError({
      _error: err.response && err.response.data.message ? err.response.data.message: err.message
    });
  })
}

const validate = (values, props) => {
  const errors = {};
  if(!values.title)
    errors.title = "Value is required";
  return errors;
}

export default reduxForm({
  'form': 'editPropertyValue',
  validate,
  onSubmit
})(EditPropertyValue);