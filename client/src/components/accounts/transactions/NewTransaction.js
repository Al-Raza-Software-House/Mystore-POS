import React, { useEffect, useMemo } from 'react';
import { makeStyles, Button, Box, Typography, FormHelperText, FormLabel } from '@material-ui/core'
import { change, Field, formValueSelector, reduxForm, SubmissionError } from 'redux-form';
import axios from 'axios';
import TextInput from '../../library/form/TextInput';
import { showProgressBar, hideProgressBar } from '../../../store/actions/progressActions';
import { connect } from 'react-redux';
import { showSuccess } from '../../../store/actions/alertActions';
import { compose } from 'redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLongArrowAltLeft } from '@fortawesome/free-solid-svg-icons';
import { Link, useHistory } from 'react-router-dom';
import { addNewTxns, createHead } from '../../../store/actions/accountActions';
import RadioInput from '../../library/form/RadioInput';
import SelectInput from '../../library/form/SelectInput';
import { transactionTypes, accountHeadTypes } from '../../../utils/constants';
import { useSelector } from 'react-redux';
import DateTimeInput from '../../library/form/DateTimeInput';
import moment from 'moment';

const transactionTypeOptions = [
  { id: transactionTypes.TRANSACTION_TYPE_CASH, title: "Cash" },
  { id: transactionTypes.TRANSACTION_TYPE_BANK, title: "Bank" },
]

const transactionTypeLabelMap = {
  [accountHeadTypes.ACCOUNT_HEAD_TYPE_GENERAL]: "Transfer amount in",
  [accountHeadTypes.ACCOUNT_HEAD_TYPE_INCOME]: "Receive amount in",
  [accountHeadTypes.ACCOUNT_HEAD_TYPE_EXPENSE]: "Pay amount in",
}

const generalHeadTxnTypes = [
  { id: -1, title: "Pay amount"},
  { id: 1, title: "Receive amount"},
]

const bankAccountHeadTxnTypes = [
  { id: -1, title: "Deposit Cash"},
  { id: 1, title: "Withdraw Cash"},
]

const formName = 'newTransaction';
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

function NewTransaction(props) {
  const history = useHistory();
  const classes = useStyles();
  const { handleSubmit, pristine, submitSucceeded, submitting, error, invalid, dirty, dispatch } = props;
  const { storeId, banks, heads, defaultBankId, lastEndOfDay } = props;

  const headId = useSelector(state => formSelector(state, 'headId'));
  const type = useSelector(state => formSelector(state, 'type'));
  const generalTxnType = useSelector(state => formSelector(state, 'generalTxnType'));

  const headOptions = useMemo(() => {
    let options = heads.map(head => ({ id: head._id, title: head.name }) );
    return [{ id: 0, title: "Select Account" }, ...options]
  }, [heads]);
  const selectedHead = useMemo(() => heads.find(head => head._id === headId), [heads, headId]);

  const bankOptions = useMemo(() => {
    return banks.map(bank => ({ id: bank._id, title: bank.name }) );
  }, [banks]);

  useEffect(() => {
    if(selectedHead && selectedHead.name === "Bank Account")
      dispatch( change(formName, 'type', transactionTypes.TRANSACTION_TYPE_CASH) );
    if((selectedHead && selectedHead.name === "Bank Account") || parseInt(type) === transactionTypes.TRANSACTION_TYPE_BANK)
      dispatch( change(formName, 'bankId', defaultBankId) );
    else if ( parseInt(type) === transactionTypes.TRANSACTION_TYPE_CASH )
      dispatch( change(formName, 'bankId', null) );
  }, [selectedHead, type]);

  useEffect(() => {
    dispatch( change(formName, 'bankId', defaultBankId) );
  }, [defaultBankId]);

  useEffect(() => {
    if(submitSucceeded)
      history.push('/accounts');
  }, [submitSucceeded, history])
    return(
      <>
      <Box width="100%" justifyContent="flex-end" display="flex">
        <Button disableElevation color="primary" startIcon={<FontAwesomeIcon icon={faLongArrowAltLeft} />} component={Link} to="/accounts">          
          Transactions
        </Button>
      </Box>
      <Box margin="auto" width={{ xs: '100%', md: '50%' }}>
        <Typography gutterBottom variant="h6" align="center">Add New Transaction</Typography>
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
              component={SelectInput}
              options={headOptions}
              name="headId"
              fullWidth={true}
              variant="outlined"
              margin="dense"
            />
          </Box>
          
          <Box textAlign="center">
            {
                selectedHead && selectedHead.name === "Bank Account" ? 
                <FormLabel> Cash Transaction <br/> withdraw/deposit store cash into bank</FormLabel> : 
                <Field
                  component={RadioInput}
                  options={transactionTypeOptions}
                  label={ selectedHead ? transactionTypeLabelMap[selectedHead.type] : "Transaction Type" }
                  id="type"
                  name="type"
                  disabled={headId === 0}
                />
              }
          </Box>
          {
            (selectedHead && selectedHead.type === accountHeadTypes.ACCOUNT_HEAD_TYPE_GENERAL ) ? 
            <Box textAlign="center" mb={2} width="100%">
              <Field
                component={RadioInput}
                options={selectedHead && selectedHead.name === "Bank Account" ? bankAccountHeadTxnTypes : generalHeadTxnTypes}
                name="generalTxnType"
                variant="outlined"
                margin="dense"
                disabled={headId === 0}
              />
            </Box>
            : null
          }
          <Box textAlign="center" mb={2}>
            <FormLabel>
              { /*Bank Deposit or withdrawl*/ }
              { (selectedHead && selectedHead.name === "Bank Account") && parseInt(generalTxnType) === -1 ? "This will reduce cash in store and amount will be added to your selected bank" : null }
              { (selectedHead && selectedHead.name === "Bank Account") && parseInt(generalTxnType) === 1 ? "This will increase cash in store and amount will be deducted from your selected bank" : null }
              { /*General Head except "Bank Account" Cash transaction*/ }
              { (selectedHead && selectedHead.name !== "Bank Account" && selectedHead.type === accountHeadTypes.ACCOUNT_HEAD_TYPE_GENERAL) && parseInt(type) === transactionTypes.TRANSACTION_TYPE_CASH && parseInt(generalTxnType) === -1 ? "This will reduce cash in store" : null }
              { (selectedHead && selectedHead.name !== "Bank Account" && selectedHead.type === accountHeadTypes.ACCOUNT_HEAD_TYPE_GENERAL) && parseInt(type) === transactionTypes.TRANSACTION_TYPE_CASH && parseInt(generalTxnType) === 1 ? "This will increase cash in store" : null }
              { /*General Head except "Bank Account" Bank transaction*/ }
              { (selectedHead && selectedHead.name !== "Bank Account" && selectedHead.type === accountHeadTypes.ACCOUNT_HEAD_TYPE_GENERAL) && parseInt(type) === transactionTypes.TRANSACTION_TYPE_BANK && parseInt(generalTxnType) === -1 ? "The amount will be deducted from your selected bank account" : null }
              { (selectedHead && selectedHead.name !== "Bank Account" && selectedHead.type === accountHeadTypes.ACCOUNT_HEAD_TYPE_GENERAL) && parseInt(type) === transactionTypes.TRANSACTION_TYPE_BANK && parseInt(generalTxnType) === 1 ? "The amount will be added to your selected bank account" : null }
              { /*Income heads cash transaction*/ }
              { (selectedHead && selectedHead.type === accountHeadTypes.ACCOUNT_HEAD_TYPE_INCOME) && parseInt(type) === transactionTypes.TRANSACTION_TYPE_CASH ? "This will increase cash in store" : null }
              { (selectedHead && selectedHead.type === accountHeadTypes.ACCOUNT_HEAD_TYPE_INCOME) && parseInt(type) === transactionTypes.TRANSACTION_TYPE_BANK ? "The income amount will be added to your selected bank account" : null }
              { /*Income heads cash transaction*/ }
              { (selectedHead && selectedHead.type === accountHeadTypes.ACCOUNT_HEAD_TYPE_EXPENSE) && parseInt(type) === transactionTypes.TRANSACTION_TYPE_CASH ? "This will reduce cash in store" : null }
              { (selectedHead && selectedHead.type === accountHeadTypes.ACCOUNT_HEAD_TYPE_EXPENSE) && parseInt(type) === transactionTypes.TRANSACTION_TYPE_BANK ? "The expense amount will be deducted from your selected bank account" : null }
            </FormLabel>
          </Box>
          {
            (selectedHead && selectedHead.name === "Bank Account") || parseInt(type) === transactionTypes.TRANSACTION_TYPE_BANK ? 
            <Box>
              <Field
                component={SelectInput}
                options={bankOptions}
                name="bankId"
                fullWidth={true}
                variant="outlined"
                margin="dense"
                disabled={headId === 0}
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
            onKeyDown={(e) => {
                  if(!((e.keyCode > 95 && e.keyCode < 106)
                    || (e.keyCode > 47 && e.keyCode < 58) 
                    || e.keyCode === 8 || e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 110 || e.keyCode === 190 )) {
                      e.preventDefault();
                      return false;
                  }
              }}
            inputProps={{  min: 1 }}
            disabled={headId === 0}
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
              disabled={headId === 0}
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
      </>
    )
}

const onSubmit = (values, dispatch, { storeId }) => {
  dispatch(showProgressBar());
  return axios.post('/api/accounts/transactions/new', {storeId, ...values}).then( response => {
    dispatch(hideProgressBar());
    if(response.data.length)
    {
      dispatch( addNewTxns(storeId, response.data) );
      dispatch( showSuccess("New transaction added") );
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
  if(!values.headId)
    errors.headId = "Please select an account head first";
  if(!values.amount)
    errors.amount = "Amount is required";
  else if(Number(values.amount) < 1)
    errors.amount = "invalid amount";
  return errors;
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  const store = state.stores.stores.find(store => store._id === storeId);
  let heads = state.accounts.heads[storeId] ? state.accounts.heads[storeId] : [];
  heads = heads.filter(head => head.systemHead === false);//get only non system head for custom transaction
  const banks = state.accounts.banks[storeId] ? state.accounts.banks[storeId] : [];
  const defaultBank = banks.find(bank => bank.default === true);
  return{
    storeId,
    heads,
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
  onSubmit,
  initialValues: { headId: 0, type: transactionTypes.TRANSACTION_TYPE_CASH, generalTxnType: -1, time: new Date() }
})
)(NewTransaction);