import React, { useEffect, useState } from 'react';
import { ListItem, ListItemText, ListItemIcon, Box, Dialog, DialogActions, DialogTitle, DialogContent, Button, CircularProgress } from '@material-ui/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { reduxForm, SubmissionError, Field, initialize  } from 'redux-form';
import axios from 'axios';
import { showSuccess } from '../../../../store/actions/alertActions';
import TextInput from '../../../library/form/TextInput';
import FormMessage from '../../../library/FormMessage';
import { updateCategory } from '../../../../store/actions/categoryActions';

function AddPropertyValue(props){
  const { dispatch, category, propertyId, handleSubmit, pristine, submitting, submitSucceeded, error, invalid } = props;
  const [open, setOpen] = useState(false);

  const handleClose = () => { 
    setOpen(false);
  }

  const handleOpen = () => {
    dispatch( initialize('addPropertyValue', {}) );
    setOpen(true);
  }

  useEffect(() => {
    if(submitSucceeded)
    {
      setOpen(false);
    }
  }, [submitSucceeded, dispatch])

  return(
  <>
    <ListItem button style={{ justifyContent: 'center' }} onClick={handleOpen}>
      <ListItemIcon style={{ minWidth: 'auto', flexGrow: 0, marginRight: 8 }}>
        <FontAwesomeIcon icon={faPlus} />
      </ListItemIcon>
      <ListItemText style={{ flexGrow: 0 }} primary="Add" />
    </ListItem>
    
    <Dialog open={open} fullWidth onClose={handleClose} aria-labelledby="form-dialog-title">
      <DialogTitle style={{ textAlign: 'center' }}>Add New { category[propertyId].name }</DialogTitle>
      <form onSubmit={handleSubmit} >
        <DialogContent>
          <Box>
            <Field
              component={TextInput}
              name="title"
              label={ category[propertyId].name }
              variant="outlined"
              fullWidth={true}
              autoFocus={true}
              placeholder={ 'Enter new ' + category[propertyId].name + '...' }
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


const onSubmit = (values, dispatch, { category, propertyId }) => {
  let data = {
    storeId: category.storeId,
    categoryId: category._id,
    propertyId,
    ...values
  }
  return axios.post('/api/categories/addPropertyValue', data).then( response => {
    if(response.data.category._id)
    {
      dispatch( updateCategory(category.storeId, category._id, response.data.category, response.data.now, response.data.lastAction) );
      dispatch( showSuccess("New value added") );
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
  'form': 'addPropertyValue',
  validate,
  onSubmit
})(AddPropertyValue);