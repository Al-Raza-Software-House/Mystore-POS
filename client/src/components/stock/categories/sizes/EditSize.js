import React, { useEffect, useState } from 'react';
import { Box, Dialog, DialogActions, DialogTitle, DialogContent, Button, CircularProgress, IconButton } from '@material-ui/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { reduxForm, SubmissionError, Field, initialize  } from 'redux-form';
import axios from 'axios';
import { showSuccess } from '../../../../store/actions/alertActions';
import TextInput from '../../../library/form/TextInput';
import FormMessage from '../../../library/FormMessage';
import { updateCategory } from '../../../../store/actions/categoryActions';

function EditSize(props){
  const { dispatch, size, handleSubmit, pristine, submitting, submitSucceeded, error, invalid } = props;
  const [open, setOpen] = useState(false);

  const handleClose = () => { 
    setOpen(false);
  }

  const editSize = () => {
    dispatch( initialize('editSize', size) );
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
    <IconButton edge="end" style={{ fontSize: 18 }} onClick={editSize}>
      <FontAwesomeIcon icon={faPencilAlt} size="sm" />
    </IconButton>
    
    <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
      <DialogTitle style={{ textAlign: 'center' }}>Update Size</DialogTitle>
      <form onSubmit={handleSubmit} >
        <DialogContent>
          
          <Box display="flex" justifyContent="space-between">
            <Box width="46%">
              <Field
                component={TextInput}
                name="code"
                label="Code"
                variant="outlined"
                fullWidth={true}
                autoFocus={true}
                placeholder="e.g. 009 or SM/MD/LG/XL"
                inputProps={{  maxlength: 3 }}
              />
            </Box>
            <Box width="46%">
              <Field
                component={TextInput}
                name="title"
                label="Size"
                variant="outlined"
                fullWidth={true}
              />
            </Box>
          </Box>
          <Box px={2} display="flex" justifyContent="center" alignItems="center">
            <Button disableElevation type="submit"  color="primary" variant="contained" disabled={pristine || submitting || invalid}>
              Update Size { submitting && <CircularProgress style={{ marginLeft: 8 }} size={24} /> }
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


const onSubmit = (values, dispatch, { storeId, categoryId, size }) => {
  let data = {
    storeId,
    categoryId,
    sizeId: size._id,
    code: values.code,
    title: values.title
  }
  return axios.post('/api/categories/editSize', data).then( response => {
    if(response.data._id)
    {
      dispatch( updateCategory(storeId, categoryId, response.data) );
      dispatch( showSuccess("Size updated") );
    }

  }).catch(err => {
    throw new SubmissionError({
      _error: err.response && err.response.data.message ? err.response.data.message: err.message
    });
  })
}

const validate = (values, props) => {
  const errors = {};
  if(!values.code)
    errors.code = "Code is required";
  if(!values.title)
    errors.title = "Size name is required";
  return errors;
}

export default reduxForm({
  'form': 'editSize',
  validate,
  onSubmit
})(EditSize);