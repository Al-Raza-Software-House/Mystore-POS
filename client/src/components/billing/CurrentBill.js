import React, { useCallback, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import moment from 'moment-timezone';
import { Box, Typography, Button, FormHelperText, CircularProgress } from "@material-ui/core";
import { reduxForm, Field, SubmissionError, formValueSelector } from 'redux-form';
import SelectInput from '../library/form/SelectInput';
import { monthsList } from '../../utils/constants';
import { showProgressBar, hideProgressBar } from '../../store/actions/progressActions';
import { loadSelectedStore, updateStore, storesStampChanged } from '../../store/actions/storeActions';
import axios from 'axios';
import TextInput from '../library/form/TextInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { amber } from '@material-ui/core/colors';
import { useDispatch } from 'react-redux';
import { showError } from 'store/actions/alertActions';

function CurrentBill(props){
  const { selectedMonths, store, loadSelectedStore, storesStampChanged, handleSubmit, submitSucceeded,  pristine, submitting, error, invalid, dirty } = props;
  const timer = useRef();
  const dispatch = useDispatch();
  const [paymentCompleted, setPaymentCompleted] = useState(false);


  const ping = useCallback(() => {
    axios.get('/api/billing/ping', { params: { storeId: store._id, txnId: store.paymentTxnId } }).then(({ data }) => {
      if(data.success)
      {
        dispatch(loadSelectedStore());
        dispatch(storesStampChanged(store._id, data.lastUpdated));
        setPaymentCompleted(true);
      }
      else
        timer.current = setTimeout(ping, 6000);
    }).catch(err => {
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
      timer.current = setTimeout(ping, 6000);
    });
  }, [store._id, store.paymentTxnId, loadSelectedStore, storesStampChanged, dispatch]);

  useEffect(() => {
    if(timer.current)
      clearTimeout(timer.current);
    if(store.paymentTxnId)
     timer.current = setTimeout(ping, 6000);
    return () => {
      if(timer.current)
        clearTimeout(timer.current)
    }
  }, [store.paymentTxnId, ping])

  

  const now = moment();
  const expiry = moment(store.expiryDate);
  const isExpired = now.isAfter(expiry);
  return(
    <>
    <Typography style={{fontSize: 18, color: isExpired ? 'red' : '#0d0d0d'}} align="center">
      Your license for <b>{ store.name }</b> { isExpired ? 'has been expired' : 'will expire' } on <span style={{fontSize: 22, fontWeight: 'bold'}}>{ expiry.format('D MMMM, YYYY hh:mm A') }</span>
      {
        isExpired && 
        <>
        <br/>
        <br/>
        <span>Please extend your license to keep using { process.env.REACT_APP_NAME }</span>
        </>
      }
      {
        !isExpired && now.add(2, 'days').isAfter(expiry) &&
        <>
        <br/>
        <br/>
        <span style={{ color: amber[700] }}> Your license is about to expire. Please extend license to keep using { process.env.REACT_APP_NAME } without interruption </span>
        </>
      }
    </Typography>
    { !submitSucceeded &&
      <Box mt={5} maxWidth={400} mx="auto" textAlign="center">
        <Typography gutterBottom  variant="h5">Extend License</Typography>
        <form onSubmit={handleSubmit}>
          <Box mb={2}>
            <Field
              component={SelectInput}
              options={monthsList}
              label=""
              id="months"
              name="months"
              variant="outlined"
              margin="dense"
              fullWidth={true}
            />
          </Box>
          <Box mb={2}>
            <Typography variant="h6">Rs. { store.monthlyPricing * selectedMonths } </Typography>
          </Box>
          <Box>
            <Field
              component={TextInput}
              id="phone"
              name="phone"
              label="EasyPaisa Mobile Account Number"
              placeholder="Enter registered easypaisa mobile account number"
              type="text"
              fullWidth={true}
              variant="outlined"
              autoFocus={true}
            />
          </Box>
          <Box textAlign="center">
            <Button disableElevation type="submit" variant="contained" color="primary" disabled={pristine || submitting || invalid || !dirty} >
              Pay with EasyPaisa
            </Button>
            {  
              <FormHelperText error={true} style={{visibility: !submitting && error ? 'visible' : 'hidden', textAlign: 'center' }}>
                <Typography component="span">{ error ? error : 'something went wrong' }</Typography>
              </FormHelperText>  
            }
          </Box>
        </form>
      </Box>
    }
    {
      submitSucceeded && !paymentCompleted &&
      <Box mt={5} textAlign="center">
        <Typography>Please turn on data on your mobile</Typography>
        <Typography>You should receive an SMS/notification from Easypaisa</Typography>
        <Typography style={{marginBottom: '20px'}}>Please open Easypaisa app your mobile and pay the amount</Typography>
        <CircularProgress style={{marginBottom: '20px'}}  size={30} />
        <Typography>We are processing your payment request</Typography>
        <Typography>Please do not close/change this page</Typography>
      </Box>
    }
    {
      submitSucceeded && paymentCompleted &&
      <Box mt={5} textAlign="center">
        <Typography>
          <FontAwesomeIcon icon={faCheckCircle} size="4x" />
          <br/>
          We have received your payment successfully
          <br/>
          Thank you for using { process.env.REACT_APP_NAME }
        </Typography>
      </Box>
    }
    </>
  )
}

const selector = formValueSelector('extendLicense');

const mapStateToProps = state => {
  const store = state.stores.stores.find(item => item._id === state.stores.selectedStoreId);
  return{
    store,
    selectedMonths: selector(state, 'months')
  }
}

const validate = (values, props) => {
  const { dirty } = props;
  if(!dirty) return {};
  const errors = {};
  if(!values.months)
    errors.months = "Please select number of months";
  if(!values.phone)
    errors.phone = "Please enter your easypaisa mobile account number"
  if(values.phone && values.phone.length > 12)
    errors.phone = 'Invalid mobile number';
  let phone = values.phone ? values.phone.replace(/-/g, '') : '';
  if ( phone && (!/^[0-9]+$/i.test(phone) || phone.length > 11 || phone.length < 10) ) {
    errors.phone = 'invalid mobile number';
  }
  return errors;
}

const onSubmit = (values, dispatch, { store }) => {
  values.storeId = store._id;
  dispatch(showProgressBar());
  return axios.post('/api/billing/pay', values).then( response => {
    dispatch(hideProgressBar());
    if(response.data.success)
    {
      dispatch( updateStore(store._id, { ...store, paymentTxnId: response.data.txnId }) )
    }
  }).catch(err => {
    dispatch(hideProgressBar());
    throw new SubmissionError({
      _error: err.response && err.response.data.message ? err.response.data.message: err.message
    });
  });
}

export default compose(
  connect(mapStateToProps, { loadSelectedStore, storesStampChanged }),
  reduxForm({
    'form': 'extendLicense',
    validate,
    onSubmit,
    initialValues: { months: 1 }
  })
)(CurrentBill);