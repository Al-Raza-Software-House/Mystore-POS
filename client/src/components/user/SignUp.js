import React, { useEffect, useRef } from 'react';
import { Box, makeStyles, Button, FormHelperText, Link, Typography, Paper, Collapse } from '@material-ui/core';
import { reduxForm, Field, SubmissionError, initialize } from "redux-form";
import TextInput from '../library/form/TextInput';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { Link as RouterLink} from 'react-router-dom';
import axios from 'axios';
import { actionTypes } from '../../store/actions/authActions';
import { showProgressBar, hideProgressBar } from '../../store/actions/progressActions';
import PasswordField from '../library/form/PasswordField';
import ReactGA from "react-ga4";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

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

const SignUp = (props) => {
  const classes = useStyles();
  const {auth, signupWizard, handleSubmit, pristine, submitting, error, invalid, dirty, dispatch, showHelp } = props
  useEffect(() => {
    document.title = "Sign Up | " + process.env.REACT_APP_NAME;
    ReactGA.send({ hitType: "pageview", page: "/signup", 'title' : "Sign Up" });
    const payload = {
        phone: true,
        verification: false,
        password: false
    }
    dispatch({type: actionTypes.SIGNUP_WIZARD_UPDATED, payload});
    dispatch(initialize('signup', {}));
  }, [dispatch]);
  const codeInputRef = useRef();
  useEffect(() => {
    if(signupWizard.verification)
      codeInputRef.current && codeInputRef.current.focus();
  }, [signupWizard.verification])

  const passwordInputRef = useRef();
  useEffect(() => {
    if(signupWizard.password)
      passwordInputRef.current && passwordInputRef.current.focus();
  }, [signupWizard.password])

  if(auth.uid)
    return <Redirect to="/dashboard" />
  return (
    <Box  className={classes.box} height={{xs: "100%", md: "80%"}} width={{ xs: '100%', sm: '420px' }}> 
      <Paper variant="outlined" style={{ flexGrow : 1}}>
        <Box p={3}>
          <Box fontSize={20} fontWeight={500} mb={3} align="center">
              Create New Account
          </Box>
          <form onSubmit={handleSubmit}>
            <Collapse in={signupWizard.phone}>
              <Box >
                <Field
                component={TextInput}
                id="name"
                name="name"
                label="Your Name"
                placeholder="Your full name"
                fullWidth={true}
                variant="outlined"
                autoFocus={true}
                />    
              </Box>

              <Box>
                <Field
                  component={TextInput}
                  id="phone"
                  name="phone"
                  label="Mobile Number"
                  placeholder="Please enter your mobile number 03011234567"
                  type="text"
                  fullWidth={true}
                  variant="outlined"
                />
              </Box>
            </Collapse>
            
            <Collapse in={signupWizard.verification}>
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

            <Collapse in={signupWizard.password}>
              <Box>
                <PasswordField inputRef={passwordInputRef} />
                <FormHelperText>
                    Please choose a password for your account
                  </FormHelperText>
              </Box>
            </Collapse>
            <Box textAlign="center">
              <Button disableElevation type="submit" variant="contained" color="primary" disabled={pristine || submitting || invalid || !dirty} >
                Next
              </Button>
              {  
                <FormHelperText className={classes.formError} error={true} style={{visibility: !submitting && error ? 'visible' : 'hidden' }}>
                  <Typography component="span">{ error ? error : 'this mobile number is already registered. Please use a different number' }</Typography>
                </FormHelperText>  
              }
            </Box>
          </form>
          
          <Box fontSize={14} fontWeight={500} mb={1} mt={2} align="center">
              <Link to="/signin" type="button" component={RouterLink}> SIGN IN </Link>
          </Box>
          <Box fontSize={14} fontWeight={500} mb={1} mt={2} align="center">
              <Button onClick={() => showHelp(true)} color="primary" variant="outlined" endIcon={<FontAwesomeIcon icon={faQuestionCircle} size="xs" />} >NEED HELP</Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}


const onSubmit = (values, dispatch, props) => {
  const user = {
    name: values.name,
    phone: values.phone
  };
  user.phone = user.phone.replace(/-/g, '');
  if(!user.phone.startsWith('0'))
    user.phone = '0'+user.phone;
  const { signupWizard, showProgressBar, hideProgressBar } = props;
  if(signupWizard.verification || signupWizard.password)
    user.pin = values.pin;
  if(signupWizard.password)
    user.password = values.password;
  showProgressBar();
  return axios.post('/api/users/signup', user).then( response => {
    hideProgressBar();
    if(response.data.user && response.data.token)
      dispatch({
        type: actionTypes.SIGNUP_SUCCESS,
        payload:{
          user: response.data.user,
          token: response.data.token
        }
      });
    dispatch(initialize('signup', values));
       const payload = {
        phone: false,
        verification: false,
        password: false
      };
      if(signupWizard.phone) payload.verification = true;
      if(signupWizard.verification) payload.password = true;
      if(signupWizard.password) payload.phone = true;
      dispatch({
        type: actionTypes.SIGNUP_WIZARD_UPDATED,
        payload
      });
  }).catch(err => {
    hideProgressBar();
    throw new SubmissionError({
      _error: err.response && err.response.data.message ? err.response.data.message: err.message
    });
  })
}

const validate = (values, props) => {
  const { dirty, signupWizard } = props;
  if(!dirty) return {};
  const errors = {};
  const required = ['name', 'phone'];
  required.forEach(item => {
    if(!values[item])
      errors[item] = item + ' is required';
  })
  if(values.phone && values.phone.length > 12)
    errors.phone = 'Invalid mobile number';
  let phone = values.phone ? values.phone.replace(/-/g, '') : '';
  if ( phone && (!/^[0-9]+$/i.test(phone) || phone.length > 11 || phone.length < 10) ) {
    errors.phone = 'invalid mobile number';
  }
  if(signupWizard.verification && !values.pin)
    errors.pin = "verification code is required";
  if(values.pin && values.pin.length !== 6)
    errors.pin = "verification code must be 6 digits";
  if(values.pin && isNaN(values.pin))
    errors.pin = "verification code must be numbers";

  if(signupWizard.password && !values.password)
    errors.password = "password is required";
  if(values.password && values.password.length < 6)
    errors.password = "Password should be at least 6 characters";
  return errors;
}

const mapStateToProps = state => {
  return {
    auth: state.auth,
    signupWizard: state.auth.signupWizard
  }
}

export default compose(
  connect(mapStateToProps, { showProgressBar, hideProgressBar }),
  reduxForm({
    form: 'signup',
    onSubmit,
    validate
  })
)(SignUp);