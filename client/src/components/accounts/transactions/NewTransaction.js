import React, { useEffect } from 'react';
import { makeStyles, Button, Box, Typography, FormHelperText } from '@material-ui/core'
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
import { createHead } from '../../../store/actions/accountActions';
import RadioInput from '../../library/form/RadioInput';
import { accountHeadTypes } from '../../../utils/constants';

let headTypes = [
  { id: accountHeadTypes.ACCOUNT_HEAD_TYPE_GENERAL, title: "General" },
  { id: accountHeadTypes.ACCOUNT_HEAD_TYPE_INCOME, title: "Income" },
  { id: accountHeadTypes.ACCOUNT_HEAD_TYPE_EXPENSE, title: "Expense" },
]

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

function CreateHead(props) {
  const history = useHistory();
  const classes = useStyles();
  const { handleSubmit, pristine, submitSucceeded, submitting, error, invalid, dirty } = props;
  useEffect(() => {
    if(submitSucceeded)
      history.push('/accounts/heads');
  }, [submitSucceeded, history])
    return(
      <>
      <Box width="100%" justifyContent="flex-end" display="flex">
        <Button disableElevation color="primary" startIcon={<FontAwesomeIcon icon={faLongArrowAltLeft} />} component={Link} to="/accounts/heads">          Account Heads
        </Button>
      </Box>
      <Box margin="auto" width={{ xs: '100%', md: '50%' }}>
        <Typography gutterBottom variant="h6" align="center">Add New Account Head</Typography>
        <form onSubmit={handleSubmit}>
          <Box textAlign="center" mb={2}>
            <Field
              component={RadioInput}
              options={headTypes}
              label=""
              id="type"
              name="type"
            />
          </Box>
          <Box>
            <Field
            component={TextInput}
            id="name"
            name="name"
            label="Name"
            placeholder="Account head name..."
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

          
          
        <Box textAlign="center">
          <Button disableElevation type="submit" variant="contained" color="primary" disabled={pristine || submitting || invalid || !dirty} >
            Add Account Head
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
  return axios.post('/api/accounts/heads/create', {storeId, ...values}).then( response => {
    dispatch(hideProgressBar());
    if(response.data.head._id)
    {
      dispatch( createHead(storeId, response.data.head, response.data.now, response.data.lastAction) );
      dispatch( showSuccess("New account head added") );
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
   errors.name = "Account head name is required";
  return errors;
}

const mapStateToProps = state => {
  return{
    storeId: state.stores.selectedStoreId
  }
}

export default compose(
connect(mapStateToProps),
reduxForm({
  'form': 'createHead',
  validate,
  onSubmit,
  initialValues: { type: accountHeadTypes.ACCOUNT_HEAD_TYPE_GENERAL }
})
)(CreateHead);