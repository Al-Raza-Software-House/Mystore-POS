import React, { useEffect } from 'react';
import { makeStyles, Button, Box, Typography, FormHelperText } from '@material-ui/core'
import { Field, initialize, reduxForm, SubmissionError } from 'redux-form';
import axios from 'axios';
import TextInput from '../../library/form/TextInput';
import { showProgressBar, hideProgressBar } from '../../../store/actions/progressActions';
import { useSelector } from 'react-redux';
import { showError, showSuccess } from '../../../store/actions/alertActions';
import { updateBank } from '../../../store/actions/accountActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLongArrowAltLeft } from '@fortawesome/free-solid-svg-icons';
import { Link, Redirect, useHistory, useParams } from 'react-router-dom';
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

function EditBank(props) {
  const history = useHistory();
  const classes = useStyles();
  const { storeId, bankId } = useParams();

  const bank = useSelector( state =>  state.accounts.banks[storeId].find(item => item._id === bankId) );
  const { dispatch, handleSubmit, pristine, submitSucceeded, submitting, error, invalid, dirty } = props;

  useEffect(() => {
    if(!bank) return;
    dispatch( initialize('editBank', {
      name: bank.name,
      default: bank.default,
      notes: bank.notes
    }) )
  }, [bank, dispatch])
  useEffect(() => {
    if(submitSucceeded)
      history.push('/accounts/banks');
  }, [submitSucceeded, history])
  if(!bankId || !bank)
  {
    dispatch(showError("Record not found"));
    return <Redirect to="/accounts/banks" />
  }
    return(
      <>
      <Box width="100%" justifyContent="flex-end" display="flex">
        <Button disableElevation color="primary" startIcon={<FontAwesomeIcon icon={faLongArrowAltLeft} />} component={Link} to="/accounts/banks">
          Banks
        </Button>
      </Box>
      <Box margin="auto" width={{ xs: '100%', md: '50%' }}>
        <Typography gutterBottom variant="h6" align="center">Update Bank</Typography>
        <form onSubmit={handleSubmit}>
          <Box>
            <Field
            component={TextInput}
            id="name"
            name="name"
            label="Bank Name"
            placeholder="Bank name..."
            fullWidth={true}
            variant="outlined"
            autoFocus={true}
            />    
          </Box>

          <Box>
            <Field
              component={TextInput}
              id="notes"
              name="notes"
              label="Notes"
              placeholder="Description or notes..."
              type="text"
              fullWidth={true}
              variant="outlined"
              multiline
              rows={3}
            />
          </Box>

          <Box textAlign="center" mb={2}>
            <Field
              component={CheckboxInput}
              label="Make it default"
              name="default"
            />
          </Box>
          
        <Box textAlign="center">
          <Button disableElevation type="submit" variant="contained" color="primary" disabled={pristine || submitting || invalid || !dirty} >
            Update Bank
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
  return axios.post('/api/accounts/banks/update', {...match.params, ...values}).then( response => {
    dispatch(hideProgressBar());
    if(response.data.bank._id)
    {
      dispatch( updateBank(match.params.storeId, match.params.bankId, response.data.bank,  response.data.now, response.data.lastAction) );
      dispatch( showSuccess("Bank updated") );
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
   errors.name = "Bank name is required";
  return errors;
}

export default 
reduxForm({
  'form': 'editBank',
  validate,
  onSubmit
})
(EditBank);