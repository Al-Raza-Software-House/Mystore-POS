import React, { useState, useEffect } from 'react';
import { ListSubheader, ListItemSecondaryAction, makeStyles, IconButton, Box, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { reduxForm, Field, initialize, SubmissionError } from 'redux-form';
import TextInput from '../../../library/form/TextInput';
import FormMessage from '../../../library/FormMessage';
import { updateCategory } from '../../../../store/actions/categoryActions';
import axios from 'axios';
import { showSuccess } from '../../../../store/actions/alertActions';

const useStyles = makeStyles(theme => ({
  listItem:{
    borderBottom: '2px solid rgba(0,0,0, 0.2)',
    textAlign: 'center'
  }
}));


function PropertyName(props) {
  const classes = useStyles();
  const { dispatch, category, propertyId, handleSubmit, pristine, submitting, submitSucceeded, error, invalid } = props;
  const [open, setOpen] = useState(false);

  const handleClose = () => { 
    setOpen(false);
  }

  const editRecord = () => {
    dispatch( initialize('editPropertyName', { name: category[propertyId].name }) );
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
      <ListSubheader className={classes.listItem} style={{ fontSize: '18px' }}>
        { category[propertyId].name }
        <ListItemSecondaryAction>
          <IconButton style={{ fontSize: 18 }} onClick={editRecord}>
            <FontAwesomeIcon icon={faPencilAlt} size="sm" />
          </IconButton>
        </ListItemSecondaryAction>
      </ListSubheader>

      <Dialog open={open} fullWidth onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogTitle style={{ textAlign: 'center' }}>Update Property Name</DialogTitle>
        <form onSubmit={handleSubmit} >
          <DialogContent>
            
            <Box>
              <Field
                component={TextInput}
                name="name"
                label="Property Name"
                variant="outlined"
                fullWidth={true}
                autoFocus={true}
                placeholder="Property Name..."
              />
            </Box> 

            <Box px={2} display="flex" justifyContent="center" alignItems="center">
              <Button disableElevation type="submit"  color="primary" variant="contained" disabled={pristine || submitting || invalid}>
                Update Name { submitting && <CircularProgress style={{ marginLeft: 8 }} size={24} /> }
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
    name: values.name
  }
  return axios.post('/api/categories/editPropertyName', data).then( response => {
    if(response.data.category._id)
    {
      dispatch( updateCategory(category.storeId, category._id, response.data.category, response.data.now, response.data.lastAction) );
      dispatch( showSuccess("Property name updated") );
    }

  }).catch(err => {
    throw new SubmissionError({
      _error: err.response && err.response.data.message ? err.response.data.message: err.message
    });
  })
}

const validate = (values, props) => {
  const errors = {};
  if(!values.name)
    errors.name = "Name is required";
  return errors;
}

export default reduxForm({
  'form': 'editPropertyName',
  validate,
  onSubmit
})(PropertyName);
