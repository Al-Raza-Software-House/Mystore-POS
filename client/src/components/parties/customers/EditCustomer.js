import React, { useEffect } from 'react';
import { makeStyles, Button, Box, Typography, FormHelperText } from '@material-ui/core'
import { Field, initialize, reduxForm, SubmissionError } from 'redux-form';
import axios from 'axios';
import TextInput from '../../library/form/TextInput';
import { showProgressBar, hideProgressBar } from '../../../store/actions/progressActions';
import { useSelector } from 'react-redux';
import { showError, showSuccess } from '../../../store/actions/alertActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLongArrowAltLeft } from '@fortawesome/free-solid-svg-icons';
import { Link, Redirect, useHistory, useParams } from 'react-router-dom';
import CheckboxInput from '../../library/form/CheckboxInput';
import { updateCustomer } from '../../../store/actions/customerActions';

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

function EditCustomer(props) {
  const history = useHistory();
  const classes = useStyles();
  const { storeId, customerId } = useParams();

  const customer = useSelector( state =>  state.customers[storeId].find(item => item._id === customerId) );
  const { dispatch, handleSubmit, pristine, submitSucceeded, submitting, error, invalid, dirty } = props;

  useEffect(() => {
    dispatch( initialize('editCustomer', customer) );
  }, [customer, dispatch])

  useEffect(() => {
    if(submitSucceeded)
      history.push('/parties/customers');
  }, [submitSucceeded, history])
  if(!customerId || !customer)
  {
    dispatch( showError("Record not found") );
    return <Redirect to="/parties/customers" />
  }
    return(
      <>
      <Box width="100%" justifyContent="flex-end" display="flex">
        <Button disableElevation color="primary" startIcon={<FontAwesomeIcon icon={faLongArrowAltLeft} />} component={Link} to="/parties/customers">
          Customers
        </Button>
      </Box>
      <Box margin="auto" width={{ xs: '100%', md: '50%' }}>
        <Typography gutterBottom variant="h6" align="center">Update Customer</Typography>
        <form onSubmit={handleSubmit}>
          <Box display="flex" justifyContent="space-between">
            <Box width={{ xs: '100%', md: '48%'}}>
              <Field
              component={TextInput}
              name="name"
              label="Customer Name"
              placeholder="Customer name..."
              fullWidth={true}
              variant="outlined"
              autoFocus={true}
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
            <Box width={{ xs: '100%', md: '30%'}} textAlign="center" pt={1}>
              <Field
                component={CheckboxInput}
                label="Allow Credit"
                name="allowCredit"
              />
            </Box>
            <Box width={{ xs: '100%', md: '32%'}}>
              <Field
                component={TextInput}
                name="creditLimit"
                label="Credit Limit"
                placeholder="Credit Limit..."
                fullWidth={true}
                variant="outlined"
                margin="dense"
                type="number"
                /> 
            </Box>
            <Box width={{ xs: '100%', md: '32%'}}>
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

          <Box>
            <Field
              component={TextInput}
              name="notes"
              label="Notes"
              placeholder="Notes..."
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
            Update Customer
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
  return axios.post('/api/customers/update', {...match.params, ...values}).then( response => {
    dispatch(hideProgressBar());
    if(response.data.customer._id)
    {
      dispatch( updateCustomer(match.params.storeId, match.params.customerId, response.data.customer,  response.data.now, response.data.lastAction) );
      dispatch( showSuccess("Customer updated") );
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
   errors.name = "Customer name is required";
  return errors;
}

const asyncValidate = (values, dispatch) => {
  if( !values.mobile) return Promise.resolve() ;
  return axios.get('/api/customers/isMobileRegistered', { params: {storeId: values.storeId, customerId: values._id, mobile: values.mobile} }).then( response => {
    if(response.data.taken)
    {
      return Promise.reject({ mobile: 'This number is already registered with a customer: '+response.data.name });
    }

  })
}

export default 
reduxForm({
  'form': 'editCustomer',
  validate,
  onSubmit,
  asyncValidate,
  asyncBlurFields: ['mobile'],
  shouldAsyncValidate: (params) => {
    const { trigger, syncValidationPasses, initialized  } = params;
      if(!syncValidationPasses) {
      return false
    }
    switch(trigger) {
      case 'blur':
        return true
      case 'submit':
        return !initialized
      default:
        return false
    }
  }
})
(EditCustomer);