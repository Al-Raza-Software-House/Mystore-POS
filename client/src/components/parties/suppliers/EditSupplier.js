import React, { useEffect } from 'react';
import { makeStyles, Button, Box, Typography, FormHelperText } from '@material-ui/core'
import { Field, initialize, reduxForm, SubmissionError } from 'redux-form';
import axios from 'axios';
import TextInput from '../../library/form/TextInput';
import { showProgressBar, hideProgressBar } from '../../../store/actions/progressActions';
import { useSelector } from 'react-redux';
import { showSuccess } from '../../../store/actions/alertActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLongArrowAltLeft } from '@fortawesome/free-solid-svg-icons';
import { Link, useHistory, useParams } from 'react-router-dom';
import { updateSupplier } from '../../../store/actions/supplierActions';

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

function EditSupplier(props) {
  const history = useHistory();
  const classes = useStyles();
  const { storeId, supplierId } = useParams();

  const supplier = useSelector( state =>  state.suppliers[storeId].find(item => item._id === supplierId) );
  const { dispatch, handleSubmit, pristine, submitSucceeded, submitting, error, invalid, dirty } = props;

  useEffect(() => {
    dispatch( initialize('editSupplier', supplier) );
  }, [supplier, dispatch])

  useEffect(() => {
    if(submitSucceeded)
      history.push('/parties');
  }, [submitSucceeded, history])
    return(
      <>
      <Box width="100%" justifyContent="flex-end" display="flex">
        <Button disableElevation color="primary" startIcon={<FontAwesomeIcon icon={faLongArrowAltLeft} />} component={Link} to="/parties">
          Suppliers
        </Button>
      </Box>
      <Box margin="auto" width={{ xs: '100%', md: '50%' }}>
        <Typography gutterBottom variant="h6" align="center">Update Supplier</Typography>
        <form onSubmit={handleSubmit}>
          <Box display="flex" justifyContent="space-between">
            <Box width={{ xs: '100%', md: '48%'}}>
              <Field
              component={TextInput}
              name="name"
              label="Supplier Name"
              placeholder="Supplier name..."
              fullWidth={true}
              variant="outlined"
              autoFocus={true}
              margin="dense"
              />    
            </Box>
            <Box width={{ xs: '100%', md: '48%'}}>
              <Field
              component={TextInput}
              name="openingBalance"
              label="Opening Balance"
              placeholder="Opening balance..."
              fullWidth={true}
              variant="outlined"
              margin="dense"
              type="number"
              />    
            </Box>
          </Box>

          <Box display="flex" justifyContent="space-between">
            <Box width={{ xs: '100%', md: '48%'}}>
              <Field
              component={TextInput}
              name="contactPersonName"
              label="Contact Person"
              placeholder="contact person name..."
              fullWidth={true}
              variant="outlined"
              margin="dense"
              />    
            </Box>
            <Box width={{ xs: '100%', md: '48%'}}>
              <Field
              component={TextInput}
              name="mobile"
              label="Mobile"
              placeholder="Mobile number..."
              fullWidth={true}
              variant="outlined"
              margin="dense"
              />    
            </Box>
          </Box>

          <Box display="flex" justifyContent="space-between">
            <Box width={{ xs: '100%', md: '48%'}}>
              <Field
              component={TextInput}
              name="phone1"
              label="Phone 1"
              placeholder="Phone number 1..."
              fullWidth={true}
              variant="outlined"
              margin="dense"
              />    
            </Box>
            <Box width={{ xs: '100%', md: '48%'}}>
              <Field
              component={TextInput}
              name="phone2"
              label="Phone 2"
              placeholder="Phone number 2..."
              fullWidth={true}
              variant="outlined"
              margin="dense"
              />    
            </Box>
          </Box>

          <Box>
            <Field
              component={TextInput}
              name="city"
              label="City"
              placeholder="City..."
              type="text"
              fullWidth={true}
              variant="outlined"
              margin="dense"
            />
          </Box>

          <Box>
            <Field
              component={TextInput}
              name="address"
              label="Address"
              placeholder="Address..."
              type="text"
              fullWidth={true}
              variant="outlined"
              multiline
              rows={3}
              margin="dense"
            />
          </Box>
          
        <Box textAlign="center">
          <Button disableElevation type="submit" variant="contained" color="primary" disabled={pristine || submitting || invalid || !dirty} >
            Update Supplier
          </Button>
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

const onSubmit = (values, dispatch, props) => {
  const { match } = props;
  dispatch(showProgressBar());
  return axios.post('/api/suppliers/update', {...match.params, ...values}).then( response => {
    dispatch(hideProgressBar());
    if(response.data.supplier._id)
    {
      dispatch( updateSupplier(match.params.storeId, match.params.supplierId, response.data.supplier,  response.data.now, response.data.lastAction) );
      dispatch( showSuccess("Supplier updated") );
    }

  }).catch(err => {
    dispatch(hideProgressBar());
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

export default 
reduxForm({
  'form': 'editSupplier',
  validate,
  onSubmit
})
(EditSupplier);