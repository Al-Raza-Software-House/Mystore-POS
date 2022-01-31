import React, { useEffect, useRef } from 'react';
import { Box, makeStyles, Button, FormHelperText, Typography, Link, Collapse, Paper } from '@material-ui/core';
import { reduxForm, Field, SubmissionError, initialize} from "redux-form";
import TextInput from '../library/form/TextInput';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Redirect, Link as RouterLink} from 'react-router-dom';
import { actionTypes } from '../../store/actions/authActions';
import { showProgressBar, hideProgressBar } from '../../store/actions/progressActions';
import axios from 'axios';
import PasswordField from '../library/form/PasswordField';
import { showSuccess } from '../../store/actions/alertActions';
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

const ResetPassword = (props) => {
  const { resetPasswordWizard, auth, handleSubmit, submitting, error, pristine, invalid, dirty, dispatch } = props
  const classes = useStyles();
  const codeInputRef = useRef();
  const passwordInputRef = useRef();
  
  useEffect(() => {
    document.title = "Reset Password | " + process.env.REACT_APP_NAME;
    dispatch({ type: actionTypes.INIT_RESET_PASSWORD });
    ReactGA.send({ hitType: "pageview", page: "/reset-password", 'title' : "Reset Password" });
  }, [dispatch]);
  
  useEffect(() => {
    if(resetPasswordWizard.verification)
      codeInputRef.current && codeInputRef.current.focus();
  }, [resetPasswordWizard.verification])
  
  useEffect(() => {
    if(resetPasswordWizard.password)
      passwordInputRef.current && passwordInputRef.current.focus();
  }, [resetPasswordWizard.password])

  if(resetPasswordWizard.changed) return <Redirect to="/signin" />

  if(auth.uid) return <Redirect to="my/dashboard" />
  return (
    <Box className={classes.box} height={{xs: "100%", md: "80%"}} width={{ xs: '100%', sm: '420px' }}>
      <Paper variant="outlined" style={{ flexGrow: 1 }}>
        <Box p={3}>
          <Box fontSize={20} fontWeight={500} mb={3} align="center">
              Reset Password  
          </Box>
          <form onSubmit={handleSubmit}>
            <Collapse in={resetPasswordWizard.phone}>
              <Box>
                  <Field
                    component={TextInput}
                    id="phone"
                    name="phone"
                    label="Mobile Number"
                    placeholder="Please enter your registered mobile number"
                    type="text"
                    fullWidth={true}
                    autoFocus={true}
                    variant="outlined"
                  />
                </Box>
            </Collapse>
            <Collapse in={resetPasswordWizard.verification}>
              <Box>
                  <Field
                    component={TextInput}
                    id="pin"
                    name="pin"
                    label="6 Digit Code"
                    fullWidth={true}
                    autoFocus={true}
                    variant="outlined"
                    placeholder="Enter 6 digit verification code"
                    inputRef={codeInputRef}
                  />
                  <FormHelperText>
                    A SMS with 6 digit verification code has been sent to your mobile number
                  </FormHelperText>
              </Box>
            </Collapse>
            <Collapse in={resetPasswordWizard.password}>
              <Box>
                <PasswordField inputRef={passwordInputRef} />
                <FormHelperText>
                  Enter new password
                </FormHelperText>
              </Box>
            </Collapse>
            <Box textAlign="center" mb={2}>
              <Button disableElevation type="submit" variant="contained" color="primary" disabled={pristine || submitting || invalid || !dirty} >
                Next
              </Button>
              {  
                <FormHelperText className={classes.formError} error={true} style={{visibility: !submitting && error ? 'visible' : 'hidden' }}>
                  <Typography component="span">{ error ? error : 'invalid request' }</Typography>
                </FormHelperText>  
              }
            </Box>
          </form>
          <Box fontSize={14} fontWeight={500} mb={1} mt={2} align="center">
              <Link to="/signin" type="button" component={RouterLink}> SIGN IN </Link>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}


const onSubmit = (values, dispatch, props) => {
  const user = { phone: values.phone };
  user.phone = user.phone.replace(/-/g, '');
  if(!user.phone.startsWith('0'))
    user.phone = '0'+user.phone;
  const { resetPasswordWizard, showProgressBar, hideProgressBar } = props;

  if(resetPasswordWizard.verification || resetPasswordWizard.password)
    user.pin = values.pin;
  if(resetPasswordWizard.password)
    user.password = values.password;
  showProgressBar();
  return axios.post('/api/users/resetPassword', user).then( response => {
    hideProgressBar();
    dispatch(initialize('resetPassword', values));
    const payload = {
      phone: false,
      verification: false,
      password: false
    };
    if(resetPasswordWizard.phone) payload.verification = true;
    if(resetPasswordWizard.verification) payload.password = true;
    if(resetPasswordWizard.password && response.data.success) {
      payload.phone = true;
      payload.changed = true;
    }
      dispatch({
        type: actionTypes.RESET_PASSWORD_WIZARD_UPDATED,
        payload
      });
    if(resetPasswordWizard.password && response.data.success)
    {
      dispatch({ type: actionTypes.RESET_PASSWORD_SUCCESS });
      dispatch( showSuccess('Password changed. Sign in with new password') )
      dispatch(initialize('resetPassword', {}));
    }
  }).catch(err => {
    hideProgressBar();
    throw new SubmissionError({
      _error: err.response && err.response.data.message ? err.response.data.message: err.message
    });
  })
}

const validate = (values, props) => {
  const { dirty, resetPasswordWizard } = props;
  if(!dirty) return {};
  const errors = {};
  if(!values.phone)
    errors.phone = "mobile number is required";
  if(values.phone && values.phone.length > 12)
    errors.phone = 'Invalid mobile number';
  let phone = values.phone ? values.phone.replace(/-/g, '') : '';
  if ( phone && (!/^[0-9]+$/i.test(phone) || phone.length > 11 || phone.length < 10) ) {
    errors.phone = 'invalid mobile number';
  }
  if(resetPasswordWizard.verification && !values.pin)
    errors.pin = "verification code is required";
  if(values.pin && values.pin.length !== 6)
    errors.pin = "verification code must be 6 digits";
  if(values.pin && isNaN(values.pin))
    errors.pin = "verification code must be numbers";

  if(resetPasswordWizard.password && !values.password)
    errors.password = "password is required";
  if(values.password && values.password.length < 6)
    errors.password = "Password should be at least 6 characters";
  return errors;
}


const mapStateToProps = state => {
  return {
    auth: state.auth,
    resetPasswordWizard: state.auth.resetPasswordWizard
  }
}

export default compose(
  connect(mapStateToProps, {showProgressBar, hideProgressBar}),
  reduxForm({
  form: 'resetPassword',
  onSubmit,
  validate
}))(ResetPassword);