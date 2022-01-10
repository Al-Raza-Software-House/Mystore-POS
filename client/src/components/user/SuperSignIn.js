import React, { useEffect } from 'react';
import { Box, makeStyles, Button, FormHelperText, Typography, Paper } from '@material-ui/core';
import { reduxForm, Field, SubmissionError} from "redux-form";
import TextInput from '../library/form/TextInput';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Redirect} from 'react-router-dom';
import { actionTypes } from '../../store/actions/authActions';
import { showProgressBar, hideProgressBar } from '../../store/actions/progressActions';
import { actionTypes as storeActions } from '../../store/actions/storeActions';
import axios from 'axios';
import PasswordField from '../library/form/PasswordField';

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

const SuperSignIn = (props) => {
  const { handleSubmit, submitting, error, dirty, pristine, invalid, uid } = props
  const classes = useStyles();
  useEffect(() => {
    document.title = "Sign In | " + process.env.REACT_APP_NAME;
  }, []);
  if(uid)
    return <Redirect to="/dashboard" />
  return (
    <Box className={classes.box} height={{xs: "100%", md: "80%"}} width={{ xs: '100%', sm: '420px' }}>
      <Paper variant="outlined" style={{ flexGrow: 1 }}>
        <Box p={3}>
          <Box fontSize={20} fontWeight={500} mb={3} align="center">
              Super Check In
          </Box>
          <form onSubmit={handleSubmit}>
            <Box>
              <Field
                component={TextInput}
                name="id"
                label="ID"
                type="text"
                fullWidth={true}
                autoFocus={true}
                variant="outlined"
                placeholder="Enter ID"
              />
            </Box>
            <Box>
              <PasswordField
                placeholder="Enter your password"
              />
            </Box>
            <Box textAlign="center" mb={2}>
              <Button disableElevation type="submit" variant="contained" color="primary" disabled={pristine || submitting || invalid || !dirty} >
                Check in
              </Button>
              {
                <FormHelperText className={classes.formError} error={true} style={{visibility: !submitting && error ? 'visible' : 'hidden' }}>
                  <Typography component="span">{ error ? error : 'invalid request' }</Typography>
                </FormHelperText>  
              }
            </Box>
          </form>
        </Box>
      </Paper>
    </Box>
  );
}


const onSubmit = (values, dispatch, { showProgressBar, hideProgressBar }) => {
  const user = {
    password: values.password,
    id: values.id
  };
  
  showProgressBar();
  return axios.post('/api/users/super925', user).then( response => {
    hideProgressBar();
    if(response.data.stores.length)
    {
      dispatch({ type: storeActions.STORES_LOADED, stores: response.data.stores });
      const role = response.data.stores[0].users.find(item => item.userId === response.data.user._id);
      dispatch({ type: storeActions.STORE_SELECTED, id: response.data.stores[0]._id,  userRole: role.userRole});
    }
    if(response.data.user && response.data.token)
      dispatch({
        type: actionTypes.LOGIN_SUCCESS,
        payload:{
          user: response.data.user,
          token: response.data.token
        }
      });
  }).catch(err => {
    hideProgressBar();
    throw new SubmissionError({
      _error: err.response && err.response.data.message ? err.response.data.message: err.message
    });
  })
}

const validate = (values, form) => {
  if(!form.dirty) return {};
  const errors = {};
  if(!values.id)
    errors.id = 'Required';
  if(!values.password)
    errors.password = 'Required';
  return errors;
}


const mapStateToProps = state => {
  return {
    uid: state.auth.uid
  }
}

export default compose(
  connect(mapStateToProps, { showProgressBar, hideProgressBar }),
  reduxForm({
  form: 'supersignin',
  onSubmit,
  validate
}))(SuperSignIn);