import React, { useEffect } from 'react';
import { makeStyles, Button, Box, Typography, FormHelperText, FormLabel } from '@material-ui/core'
import { Field, initialize, reduxForm, SubmissionError } from 'redux-form';
import axios from 'axios';
import TextInput from '../../library/form/TextInput';
import { showProgressBar, hideProgressBar } from '../../../store/actions/progressActions';
import { useSelector } from 'react-redux';
import { showError, showSuccess } from '../../../store/actions/alertActions';
import { updateHead } from '../../../store/actions/accountActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLongArrowAltLeft } from '@fortawesome/free-solid-svg-icons';
import { Link, Redirect, useHistory, useParams } from 'react-router-dom';
import { accountHeadTypes } from '../../../utils/constants';
import ReactGA from "react-ga4";

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

const headTypesMaps = {
  [accountHeadTypes.ACCOUNT_HEAD_TYPE_GENERAL]: "General",
  [accountHeadTypes.ACCOUNT_HEAD_TYPE_INCOME]: "Income",
  [accountHeadTypes.ACCOUNT_HEAD_TYPE_EXPENSE]: "Expense",
}

function EditHead(props) {
  const history = useHistory();
  const classes = useStyles();
  const { storeId, headId } = useParams();
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/accounts/heads/edit", 'title' : "Edit Head" });
  }, []);

  const head = useSelector( state =>  state.accounts.heads[storeId].find(item => item._id === headId) );
  const { dispatch, handleSubmit, pristine, submitSucceeded, submitting, error, invalid, dirty } = props;

  useEffect(() => {
    if(!head) return;
    dispatch( initialize('editHead', {
      name: head.name,
      notes: head.notes
    }) )
  }, [head, dispatch])
  useEffect(() => {
    if(submitSucceeded)
      history.push('/accounts/heads');
  }, [submitSucceeded, history])
  if(!headId || !head)
  {
    dispatch(showError("Record not found"));
    return <Redirect to="/accounts/heads" />
  }
    return(
      <>
      <Box width="100%" justifyContent="flex-end" display="flex">
        <Button disableElevation color="primary" startIcon={<FontAwesomeIcon icon={faLongArrowAltLeft} />} component={Link} to="/accounts/heads">
          Account Heads
        </Button>
      </Box>
      <Box margin="auto" width={{ xs: '100%', md: '50%' }}>
        <Typography gutterBottom variant="h6" align="center">Update Account Head</Typography>
        <form onSubmit={handleSubmit}>
          <Box mb={4}>
            <FormLabel>
              Type: { headTypesMaps[head.type] }
            </FormLabel>
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
            Update Account Head
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
  return axios.post('/api/accounts/heads/update', {...match.params, ...values}).then( response => {
    dispatch(hideProgressBar());
    if(response.data.head._id)
    {
      dispatch( updateHead(match.params.storeId, match.params.headId, response.data.head,  response.data.now, response.data.lastAction) );
      dispatch( showSuccess("Account updated") );
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

export default 
reduxForm({
  'form': 'editHead',
  validate,
  onSubmit
})
(EditHead);