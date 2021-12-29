import React, { useEffect } from 'react';
import { makeStyles, Button, Box, Typography, FormHelperText, CircularProgress } from '@material-ui/core'
import { Field, reduxForm, SubmissionError } from 'redux-form';
import axios from 'axios';
import TextInput from '../../library/form/TextInput';
import { showProgressBar, hideProgressBar } from '../../../store/actions/progressActions';
import { connect } from 'react-redux';
import { showSuccess } from '../../../store/actions/alertActions';
import { compose } from 'redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLongArrowAltLeft } from '@fortawesome/free-solid-svg-icons';
import { Link, useHistory } from 'react-router-dom';
import { createCustomer } from '../../../store/actions/customerActions';
import CheckboxInput from '../../library/form/CheckboxInput';

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

function CreateCustomer(props) {
  const history = useHistory();
  const classes = useStyles();
  const { handleSubmit, pristine, submitSucceeded, submitting, error, invalid, dirty, closeDialog } = props;
  useEffect(() => {
    if(submitSucceeded && !closeDialog)
    {
      history.push('/parties/customers');
    }
  }, [submitSucceeded, history, closeDialog])
    return(
      <>
      {
        closeDialog ? null : 
        <Box width="100%" justifyContent="flex-end" display="flex">
          <Button disableElevation color="primary" startIcon={<FontAwesomeIcon icon={faLongArrowAltLeft} />} component={Link} to="/parties/customers">
            Customers
          </Button>
        </Box>
      }
      <Box margin="auto" width={{ xs: '100%', md: closeDialog ? '100%' : '50%' }}>
        <Typography gutterBottom variant="h6" align="center">Add New Customer</Typography>
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
            Add Customer { closeDialog && submitting && <CircularProgress style={{ marginLeft: 8 }} size={24} /> }
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

const onSubmit = (values, dispatch, { storeId, closeDialog }) => {
  if(!closeDialog)
    dispatch(showProgressBar());
  return axios.post('/api/customers/create', {storeId, ...values}).then( response => {
    if(!closeDialog) dispatch(hideProgressBar());
    if(response.data.customer._id)
    {
      dispatch( createCustomer(storeId, response.data.customer, response.data.now, response.data.lastAction) );
      dispatch( showSuccess("New customer added") );
      if(closeDialog)
       closeDialog(response.data.customer._id);
    }

  }).catch(err => {
    if(!closeDialog) dispatch(hideProgressBar());
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

const mapStateToProps = state => {
  return{
    storeId: state.stores.selectedStoreId
  }
}

const asyncValidate = (values, dispatch, { storeId }) => {
  if( !values.mobile) return Promise.resolve() ;
  return axios.get('/api/customers/isMobileRegistered', { params: {storeId, mobile: values.mobile} }).then( response => {
    if(response.data.taken)
    {
      return Promise.reject({ mobile: 'This number is already registered with a customer: '+response.data.name });
    }

  })
}

export default compose(
connect(mapStateToProps),
reduxForm({
  'form': 'createCustomer',
  validate,
  onSubmit,
  asyncValidate,
  asyncBlurFields: ['mobile'],
  initialValues: {},
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
)(CreateCustomer);