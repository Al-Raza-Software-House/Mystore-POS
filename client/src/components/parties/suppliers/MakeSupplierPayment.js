import React, { useEffect, useMemo } from 'react';
import { makeStyles, Button, Box, Typography, FormHelperText } from '@material-ui/core'
import { change, Field, formValueSelector, initialize, reduxForm, SubmissionError } from 'redux-form';
import axios from 'axios';
import TextInput from '../../library/form/TextInput';
import { showProgressBar, hideProgressBar } from '../../../store/actions/progressActions';
import { connect } from 'react-redux';
import { showSuccess } from '../../../store/actions/alertActions';
import { compose } from 'redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLongArrowAltLeft } from '@fortawesome/free-solid-svg-icons';
import { Link, useHistory, useParams } from 'react-router-dom';
import RadioInput from '../../library/form/RadioInput';
import SelectInput from '../../library/form/SelectInput';
import { paymentModes } from '../../../utils/constants';
import { useSelector } from 'react-redux';
import DateTimeInput from '../../library/form/DateTimeInput';
import moment from 'moment';
import { updateSupplier } from '../../../store/actions/supplierActions';
import { addNewTxns } from '../../../store/actions/accountActions';
import CheckboxInput from '../../library/form/CheckboxInput';
import { allowOnlyPostiveNumber } from '../../../utils';

const paymentModeOptions = [
  { id: paymentModes.PAYMENT_MODE_CASH, title: "Cash" },
  { id: paymentModes.PAYMENT_MODE_BANK, title: "Bank" },
]

const payReceiveTypes = [
  { id: -1, title: "Pay amount"},
  { id: 1, title: "Receive amount"},
]


const formName = 'makeSupplierPayment';
const formSelector = formValueSelector(formName);

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

function MakeSupplierPayment(props) {
  const history = useHistory();
  const classes = useStyles();
  const { handleSubmit, pristine, submitSucceeded, submitting, error, invalid, dirty, dispatch } = props;
  const { banks, defaultBankId, lastEndOfDay } = props;
  useEffect(() => {
    dispatch( initialize(formName, { type: paymentModes.PAYMENT_MODE_CASH, payOrRecieve: -1, time: moment().format("DD MMMM, YYYY hh:mm A") })  );
  }, [dispatch]);

  const { storeId, supplierId } = useParams();

  const supplier = useSelector( state =>  state.suppliers[storeId].find(item => item._id === supplierId) );

  const type = useSelector(state => formSelector(state, 'type'));

  const bankOptions = useMemo(() => {
    return banks.map(bank => ({ id: bank._id, title: bank.name }) );
  }, [banks]);

  useEffect(() => {
    dispatch( change(formName, 'bankId', defaultBankId) );
  }, [defaultBankId, dispatch]);

  useEffect(() => {
    if(submitSucceeded)
      history.push(`/parties/suppliers/ledger/${storeId}/${supplierId}`);
  }, [submitSucceeded, history, storeId, supplierId])
    return(
      <>
      <Box width="100%" justifyContent="flex-end" display="flex">
        <Button disableElevation color="primary" startIcon={<FontAwesomeIcon icon={faLongArrowAltLeft} />} component={Link} to={`/parties/suppliers/ledger/${storeId}/${supplierId}`}>          
          {supplier.name } Ledger
        </Button>
      </Box>
      <Box margin="auto" width={{ xs: '100%', md: '70%', xl: '50%' }}>
        <Typography gutterBottom variant="h6" align="center">New Supplier Transaction: { supplier.name }</Typography>
        <Box display="flex" justifyContent="between">
          <Box width={{ xs: '100%', md: '50%' }}>
            <Typography gutterBottom variant="h6">Ledger Details</Typography>
            <Box display="flex" justifyContent="between" flexWrap="wrap">
              <Box width="60%"><Typography gutterBottom>Opening Balance: </Typography></Box>
              <Box width="40%"><Typography gutterBottom><b>{ supplier.openingBalance.toLocaleString() }</b> </Typography></Box>

              <Box width="60%"><Typography gutterBottom>Total Purchases: </Typography></Box>
              <Box width="40%"><Typography gutterBottom><b>{ supplier.totalPurchases.toLocaleString() }</b> </Typography></Box>

              <Box width="60%"><Typography gutterBottom>Total Returns: </Typography></Box>
              <Box width="40%"><Typography gutterBottom><b>{ supplier.totalReturns.toLocaleString() }</b> </Typography></Box>

              <Box width="60%"><Typography gutterBottom>Total Amount Paid: </Typography></Box>
              <Box width="40%"><Typography gutterBottom><b>{ supplier.totalPayment.toLocaleString() }</b> </Typography></Box>

              <Box width="60%"><Typography gutterBottom>Net Payable: </Typography></Box>
              <Box width="40%"><Typography gutterBottom><b>{ supplier.currentBalance.toLocaleString() }</b> </Typography></Box>
            </Box>
            
          </Box>
          <Box width={{ xs: '100%', md: '50%' }}>
            <form onSubmit={handleSubmit}>
              <Box textAlign="center" mb={2}>
                <Field
                  component={DateTimeInput}
                  label="Transaction Time"
                  name="time"
                  dateFormat="DD MMMM, YYYY hh:mm A"
                  fullWidth={true}
                  inputVariant="outlined"
                  margin="dense"
                  emptyLabel=""
                  minDate={ moment(lastEndOfDay).toDate() }
                  maxDate={ moment().toDate() }
                  showTodayButton
                />  
              </Box>
              
              
              <Box textAlign="center">
                <Field
                  component={RadioInput}
                  options={paymentModeOptions}
                  label="Mode"
                  id="type"
                  name="type"
                />
              </Box>

              <Box textAlign="center" mb={2} width="100%">
                <Field
                  component={RadioInput}
                  options={payReceiveTypes}
                  name="payOrRecieve"
                  variant="outlined"
                  margin="dense"
                />
              </Box>

              {
                parseInt(type) === paymentModes.PAYMENT_MODE_BANK ?
                <Box>
                  <Field
                    component={SelectInput}
                    options={bankOptions}
                    name="bankId"
                    fullWidth={true}
                    variant="outlined"
                    margin="dense"
                  />
                </Box>
                : null
              }
              <Box>
                <Field
                component={TextInput}
                id="amount"
                name="amount"
                label="Amount"
                placeholder="Amount..."
                fullWidth={true}
                variant="outlined"
                margin="dense"
                type="number"
                onKeyDown={allowOnlyPostiveNumber}
                inputProps={{  min: 1 }}
                />    
              </Box>

              <Box>
                <Field
                  component={TextInput}
                  id="notes"
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
                <Field
                  component={CheckboxInput}
                  name="printTxn"
                  label="Print Transaction Receipt"
                  fullWidth={true}
                  disabled={pristine || submitting || invalid || !dirty}
                />
              </Box>

              
              
            <Box textAlign="center">
              <Button disableElevation type="submit" variant="contained" color="primary" disabled={pristine || submitting || invalid || !dirty} >
                Add Transaction
              </Button>
              {  
                <FormHelperText className={classes.formError} error={true} style={{visibility: !submitting && error ? 'visible' : 'hidden' }}>
                  <Typography component="span">{ error ? error : 'invalid request' }</Typography>
                </FormHelperText>  
              }
            </Box>
            </form>
          </Box>
        </Box>
      </Box>
      </>
    )
}

const onSubmit = (values, dispatch, { match, printTxn }) => {
  dispatch(showProgressBar());
  return axios.post('/api/suppliers/makePayment', {...match.params, ...values, time: moment(values.time, "DD MMMM, YYYY hh:mm A").toDate()}).then( response => {
    dispatch(hideProgressBar());
    if(response.data.supplier._id)
    {
      dispatch( updateSupplier(match.params.storeId, match.params.supplierId, response.data.supplier,  response.data.now, response.data.lastAction) );
      if(response.data.accountTxn._id)
        dispatch( addNewTxns( match.params.storeId, [response.data.accountTxn] ) );
      dispatch( showSuccess("Payment added") );
      if(response.data.txn._id && values.printTxn)
        printTxn({ ...response.data.txn, supplier: response.data.supplier });
    }
  }).catch(err => {
    dispatch(hideProgressBar());
    throw new SubmissionError({
      _error: err.response && err.response.data.message ? err.response.data.message: err.message
    });
  });
}

const validate = (values, props) => {
  const { dirty, lastEndOfDay } = props;
  if(!dirty) return {};
  const errors = {};
  if(lastEndOfDay && moment(values.time, "DD MMMM, YYYY hh:mm A") <= moment(lastEndOfDay))
    errors.time = "Date & time should be after last day closing: " + moment(lastEndOfDay).format("DD MMMM, YYYY hh:mm A");
  else if(moment(values.time, "DD MMMM, YYYY hh:mm A") > moment())
    errors.time = "Date & time should not be after current time: " + moment().format("DD MMMM, YYYY hh:mm A"); 
  if(!values.amount || Number(values.amount) === 0)
    errors.amount = "Amount is required";
  else if(isNaN(Number(values.amount)))
    errors.amount = "invalid amount";
  return errors;
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  const store = state.stores.stores.find(store => store._id === storeId);
  const banks = state.accounts.banks[storeId] ? state.accounts.banks[storeId] : [];
  const defaultBank = banks.find(bank => bank.default === true);
  return{
    storeId,
    banks,
    defaultBankId: defaultBank ? defaultBank._id : null,
    lastEndOfDay: store.lastEndOfDay
  }
}

export default compose(
connect(mapStateToProps),
reduxForm({
  'form': formName,
  validate,
  onSubmit
})
)(MakeSupplierPayment);