import React from 'react';
import { IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Box, CircularProgress } from '@material-ui/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { Field, reduxForm, SubmissionError } from 'redux-form';
import axios from 'axios';
import PasswordField from '../library/form/PasswordField';
import FormMessage from '../library/FormMessage';
import { deleteStore } from '../../store/actions/storeActions';
import { showSuccess } from '../../store/actions/alertActions';

function DeleteStore(props) {
  const [open, setOpen] = React.useState(false);
  const { name, handleSubmit, pristine, submitting, error, invalid } = props;
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return(
    <>
    <IconButton title="Delete Store" onClick={handleClickOpen}>
      <FontAwesomeIcon icon={faTrash} size="xs" />
    </IconButton>

    <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Delete Store: { name }</DialogTitle>
      <form onSubmit={handleSubmit} >
        <DialogContent>
          <DialogContentText>
            You are about to delete a store. All data of this store(stock, sales, purchase, customers, suppliers, reports, accounts) will be deleted.
            Please enter your password to delete store
          </DialogContentText>
          <Box>
            <Field
              component={PasswordField}
              name="password"
              label="Password"
              variant="outlined"
              fullWidth={true}
              autoFocus={true}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Box px={2} display="flex" justifyContent="space-between" alignItems="center">
            { error && 
                <FormMessage error={true} >
                { error }
                </FormMessage>  
              }
            <div>
              <Button disableElevation type="button" onClick={handleClose} color="primary">
                Cancel
              </Button>
              <Button disableElevation type="submit"  color="primary" variant="contained" disabled={pristine || submitting || invalid}>
                Delete { submitting && <CircularProgress style={{ marginLeft: 8 }} size={24} /> }
              </Button>
            </div>
          </Box>
        </DialogActions>
      </form>
    </Dialog>

    </>
  )
  
}

const onSubmit = (values, dispatch, { id}) => {
  values.id = id;
  return axios.post('/api/stores/delete', values).then( response => {
    if(response.data.success)
    {
      dispatch( showSuccess("Store deleted") );
      dispatch( deleteStore(id) );
    }

  }).catch(err => {
    throw new SubmissionError({
      _error: err.response && err.response.data.message ? err.response.data.message: err.message
    });
  })
}

const validate = (values, props) => {
  const errors = {};
  if(!values.password)
    errors.password = "Password is required";
  if(values.password && values.password.length < 6)
    errors.password = "Password should be at least 6 characters";
  return errors;
}




export default reduxForm({
  'form': 'deleteStore',
  validate,
  onSubmit
})(DeleteStore);