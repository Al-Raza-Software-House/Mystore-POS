import React, { useEffect } from 'react';
import { makeStyles, Button, Box, Typography, FormHelperText } from '@material-ui/core'
import { Field, initialize, reduxForm, SubmissionError } from 'redux-form';
import axios from 'axios';
import TextInput from '../../library/form/TextInput';
import { showProgressBar, hideProgressBar } from '../../../store/actions/progressActions';
import { useSelector } from 'react-redux';
import { showError, showSuccess } from '../../../store/actions/alertActions';
import { updateAdjustmentReason } from '../../../store/actions/adjustmentReasonActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLongArrowAltLeft } from '@fortawesome/free-solid-svg-icons';
import { Link, Redirect, useHistory, useParams } from 'react-router-dom';
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

function EditAdjustmentReason(props) {
  const history = useHistory();
  const classes = useStyles();
  const { storeId, reasonId } = useParams();
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/stock/adjustmentReasons/edit", 'title' : "Edit Adjustment Reason" });
  }, []);

  const reason = useSelector( state =>  state.adjustmentReasons[storeId].find(item => item._id === reasonId) );
  const { dispatch, handleSubmit, pristine, submitSucceeded, submitting, error, invalid, dirty } = props;

  useEffect(() => {
    if(!reason) return;
    dispatch( initialize('editAdjustmentReason', {
      type: reason.type,
      name: reason.name,
      notes: reason.notes
    }) )
  }, [reason, dispatch])
  useEffect(() => {
    if(submitSucceeded)
      history.push('/stock/adjustmentReasons');
  }, [submitSucceeded, history])
  if(!reasonId || !reason)
  {
    dispatch( showError("Reason not found") );
    return <Redirect to="/stock/adjustmentReasons" />
  }
    return(
      <>
      <Box width="100%" justifyContent="flex-end" display="flex">
        <Button disableElevation color="primary" startIcon={<FontAwesomeIcon icon={faLongArrowAltLeft} />} component={Link} to="/stock/adjustmentReasons">
          Adjustment Reasons
        </Button>
      </Box>
      <Box margin="auto" width={{ xs: '100%', md: '50%' }}>
        <Typography gutterBottom variant="h6" align="center">Update Adjustment Reason</Typography>
        <form onSubmit={handleSubmit}>
          <Box>
            <Field
            component={TextInput}
            id="name"
            name="name"
            label="Reason Title"
            placeholder="Reason title..."
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
            Update Reason
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
  return axios.post('/api/adjustmentReasons/update', {...match.params, ...values}).then( response => {
    dispatch(hideProgressBar());
    if(response.data.reason._id)
    {
      dispatch( updateAdjustmentReason(match.params.storeId, match.params.reasonId, response.data.reason,  response.data.now, response.data.lastAction) );
      dispatch( showSuccess("Adjustment reason updated") );
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
   errors.name = "Reason title is required";
  return errors;
}

export default 
reduxForm({
  'form': 'editAdjustmentReason',
  validate,
  onSubmit
})
(EditAdjustmentReason);