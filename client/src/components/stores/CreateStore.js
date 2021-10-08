import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { reduxForm, Field, SubmissionError } from 'redux-form';
import { Box, makeStyles, Button,  Paper } from '@material-ui/core';
import FormMessage from '../library/FormMessage';
import TextInput from '../library/form/TextInput';
import RadioInput from '../library/form/RadioInput';
import {  createStore, selectStore } from '../../store/actions/storeActions';
import { businessTypes } from '../../utils/constants';
import { Redirect } from 'react-router';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { userTypes } from '../../utils/constants';
import { showProgressBar, hideProgressBar } from '../../store/actions/progressActions';
import { showSuccess } from '../../store/actions/alertActions';

const useStyles = makeStyles(theme => ({
  paper:{
    width: '100%',
    [theme.breakpoints.up('md')]:{
      width: '70%',
      margin: 'auto'
    }
  },
  button: {
    margin: theme.spacing(1)
  }
}));

const CreateStore = (props) => {
  const classes = useStyles();
  const { handleSubmit, pristine, submitting, error, invalid, submitSucceeded } = props;
  if(submitSucceeded) return <Redirect to="/dashboard"/>
  return (
    <Box p={3}>
      <Paper className={classes.paper} variant="outlined">
        <Box p={3}>
          <form onSubmit={handleSubmit} >
            <Box fontSize={20} fontWeight={500} mb={1} align="center" >
                Create New Store
            </Box>
            <Box>
              <Field
              component={TextInput}
              id="storeName"
              name="storeName"
              label="Store Name"
              placeholder="Full name of store"
              fullWidth={true}
              variant="outlined"
              autoFocus={true}
              />    
            </Box>
            <Box>
              <Field
                component={TextInput}
                id="phone1"
                name="phone1"
                label="Phone Number"
                type="text"
                fullWidth={true}
                variant="outlined"
                placeholder="Phone number of store"
              />
            </Box>

            <Box>
              <Field
                component={TextInput}
                id="city"
                name="city"
                label="City"
                type="text"
                fullWidth={true}
                variant="outlined"
                placeholder="City where store is located"
              />
            </Box>

            <Box>
              <Field
                component={TextInput}
                multiline={true}
                rows={3}
                id="address"
                name="address"
                label="Address"
                type="text"
                fullWidth={true}
                variant="outlined"
                placeholder="Complete address of store"
              />
            </Box>

            <Box mb={2}>
              <Field
                component={RadioInput}
                options={businessTypes}
                label="Business Type"
                id="businessType"
                name="businessType"
                defaultValue="1"
              />
            </Box>

            <Box display="flex" alignItems="center" justifyContent="center">
              <Button disableElevation type="submit" variant="contained" color="primary" disabled={pristine || submitting || invalid} className={classes.button}>
                Create Store
              </Button>
            </Box>
            { error && 
                <FormMessage error={true} >
                { error }
                </FormMessage>  
              }
              <Box display="flex" justifyContent="center">
                <Button disableElevation color="primary" component={Link} to="/stores">Go Back</Button>
              </Box>
          </form>
        </Box>
      </Paper>
    </Box>
  );
}

const onSubmit = (values, dispatch, {  showProgressBar, hideProgressBar }) => {
  showProgressBar();
  return axios.post('/api/stores/create', values).then( response => {
    hideProgressBar();
    if(response.data._id)
    {
      dispatch( createStore(response.data) );
      dispatch( selectStore(response.data._id, userTypes.USER_ROLE_OWNER) );
      dispatch( showSuccess("New store created") );
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
  if(!values.storeName)
    errors.storeName = "Store name is required";
  if(!values.businessType)
    errors.businessType = "Business type is required";
  return errors;
}



const mapStateToProps = (state) => {
  return {
    initialValues: { businessType: 1 }
  }
}
 
export default compose(
  connect(mapStateToProps, { showProgressBar, hideProgressBar }),
  reduxForm({
    form: 'createStore',
    validate,
    onSubmit
  })
)(CreateStore);