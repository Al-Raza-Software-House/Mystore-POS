import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { reduxForm, Field, SubmissionError, initialize } from 'redux-form';
import { Box, makeStyles, Button,  Collapse, Paper } from '@material-ui/core';
import FormMessage from '../library/FormMessage';
import TextInput from '../library/form/TextInput';
import PasswordField from '../library/form/PasswordField';
import { actionTypes } from '../../store/actions/authActions';
import axios from 'axios';
import { Redirect } from 'react-router-dom';
import { showProgressBar, hideProgressBar } from '../../store/actions/progressActions';
import { showSuccess } from '../../store/actions/alertActions';

const useStyles = makeStyles(theme => ({
  paper:{
    width: '100%',
    [theme.breakpoints.up('md')]:{
      width: '50%',
      margin: 'auto'
    }
  },
  button: {
    margin: theme.spacing(1)
  }
}));

const AccountSettings = (props) => {
  const classes = useStyles();
  const { auth, handleSubmit, pristine, submitting, error, invalid } = props;
  if(!auth.uid)  return <Redirect to="signin" />
  return (
    <Box p={3}>
      <Paper className={classes.paper} variant="outlined">
        <Box p={3}>
          <form onSubmit={handleSubmit} >
            <Box fontSize={20} fontWeight={500} mb={1} align="center">
                Account Settings
            </Box>
            <Collapse> { /*To disable chrome Autofill */ }
              <label htmlFor="email">Email Address</label>
              <input type="email" name="email" id="email" />
              <input type="password" name="currentPassword" id="password"/>
            </Collapse>
            <Box>
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
                type="text"
                fullWidth={true}
                autoFocus={true}
                variant="outlined"
                placeholder="Enter your registered mobile number"
                disabled
              />
            </Box>
            <Box>
              <Field
                component={PasswordField}
                name="currentPassword"
                label="Current Password"
                variant="outlined"
                fullWidth={true}
              />
            </Box>
            <Box>
              <Field
                component={PasswordField}
                name="newPassword"
                label={"New Password"}
                variant="outlined"
                fullWidth={true}
                />
            </Box>

            <Box display="flex" justifyContent="center">
              <Button disableElevation type="submit" variant="contained" color="primary" disabled={pristine || submitting || invalid} className={classes.button}>
                Update
              </Button>
            </Box>
            { error && 
                <FormMessage error={true} >
                { error }
                </FormMessage>  
              }
          </form>
        </Box>
      </Paper>
    </Box>
  );
}

const onSubmit = (values, dispatch, {  showProgressBar, hideProgressBar }) => {
  showProgressBar();
  return axios.post('/api/users/settings', values).then( response => {
    hideProgressBar();
    if(response.data._id)
    {
      dispatch({
        type: actionTypes.ACCOUNT_SETTINGS_UPDATED,
        data: response.data
      });
      dispatch(initialize('accountSetting', {name: values.name, phone: values.phone}));
      dispatch( showSuccess("Acccount settings updated") );
    }

  }).catch(err => {
    hideProgressBar();
    throw new SubmissionError({
      _error: err.response && err.response.data.message ? err.response.data.message: err.message
    });
  })
}

const validate = (values, props) => {
  const errors = {};
  if(!values.name)
    errors.name = "Name is required";
  if(values.newPassword && !values.currentPassword)
    errors.currentPassword = "Current password is required to change the password";
  if(values.currentPassword && values.currentPassword.length < 6)
    errors.currentPassword = "Password should be at least 6 characters";
  if(values.newPassword && values.newPassword.length < 6)
    errors.newPassword = "Password should be at least 6 characters";
  return errors;
}



const mapStateToProps = (state) => {
  return {
    auth: state.auth,
    initialValues: state.auth.account ? state.auth.account : {}
  }
}
 
export default compose(
  connect(mapStateToProps, { showProgressBar, hideProgressBar }),
  reduxForm({
    form: 'accountSetting',
    validate,
    onSubmit
  })
)(AccountSettings);