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

function EditCombination(props){
  const { dispatch, combination, handleSubmit, pristine, submitting, submitSucceeded, error, invalid } = props;
  const [open, setOpen] = useState(false);

  const handleClose = () => { 
    setOpen(false);
  }

  const editCombination = () => {
    dispatch( initialize('editCombination', combination) );
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
    <IconButton edge="end" style={{ fontSize: 18 }} onClick={editCombination}>
      <FontAwesomeIcon icon={faPencilAlt} size="sm" />
    </IconButton>
    
    <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
      <DialogTitle style={{ textAlign: 'center' }}>Update Color</DialogTitle>
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
                placeholder="e.g. 009 or BLK/RD/BLU"
                inputProps={{  maxlength: 3 }}
              />
            </Box>
            <Box width="46%">
              <Field
                component={TextInput}
                name="title"
                label="Color"
                variant="outlined"
                fullWidth={true}
              />
            </Box>
          </Box>
          <Box px={2} display="flex" justifyContent="center" alignItems="center">
            <Button disableElevation type="submit"  color="primary" variant="contained" disabled={pristine || submitting || invalid}>
              Update Color { submitting && <CircularProgress style={{ marginLeft: 8 }} size={24} /> }
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


const onSubmit = (values, dispatch, { storeId, categoryId, combination }) => {
  let data = {
    storeId,
    categoryId,
    combinationId: combination._id,
    code: values.code,
    title: values.title
  }
  return axios.post('/api/categories/editCombination', data).then( response => {
    if(response.data._id)
    {
      dispatch( updateCategory(storeId, categoryId, response.data) );
      dispatch( showSuccess("Color updated") );
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
    errors.title = "Color name is required";
  return errors;
}

export default reduxForm({
  'form': 'editCombination',
  validate,
  onSubmit
})(EditCombination);