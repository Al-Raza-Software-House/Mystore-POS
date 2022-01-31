import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { reduxForm, Field, SubmissionError, initialize } from 'redux-form';
import { Box, makeStyles, Button } from '@material-ui/core';
import FormMessage from '../library/FormMessage';
import TextInput from '../library/form/TextInput';
import {  storesStampChanged, updateStore } from '../../store/actions/storeActions';
import axios from 'axios';
import { showProgressBar, hideProgressBar } from '../../store/actions/progressActions';
import { showSuccess } from '../../store/actions/alertActions';
import ReactGA from "react-ga4";

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

const General = (props) => {
  const classes = useStyles();
  const { handleSubmit, pristine, submitting, error, invalid } = props;
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/store-settings", 'title' : "General Settings" });
  }, []);
  return (
    <Box width={{ xs: '100%', md: '50%' }} >
      <form onSubmit={handleSubmit} >
        <Box>
          <Field
          component={TextInput}
          id="name"
          name="name"
          label="Store Name"
          placeholder="Full name of store"
          fullWidth={true}
          variant="outlined"
          margin="dense"
          />    
        </Box>
        <Box>
          <Field
            component={TextInput}
            id="phone1"
            name="phone1"
            label="Contact Mobile 1"
            type="text"
            fullWidth={true}
            variant="outlined"
            placeholder="Contact number of store"
            margin="dense"
          />
        </Box>

        <Box>
          <Field
            component={TextInput}
            id="phone2"
            name="phone2"
            label="Contact Mobile 2"
            type="text"
            fullWidth={true}
            variant="outlined"
            placeholder="Contact number 2 of store"
            margin="dense"
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
            margin="dense"
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
            margin="dense"
          />
        </Box>

        

        <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column"> 
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
  );
}

const onSubmit = (values, dispatch, {  showProgressBar, hideProgressBar, selectedStoreId }) => {
  showProgressBar();
  return axios.post('/api/stores/update', { id: selectedStoreId,  ...values}).then( response => {
    hideProgressBar();
    if(response.data.store._id)
    {
      dispatch( updateStore(selectedStoreId, response.data.store) );
      dispatch( storesStampChanged(selectedStoreId, response.data.now) );
      dispatch( initialize('storeGeneralSettings', response.data.store) );
      dispatch( showSuccess("Store info updated") );
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
    errors.name = "Store name is required";
  return errors;
}



const mapStateToProps = (state) => {
  const store = state.stores.stores.find(item => item._id === state.stores.selectedStoreId);
  return {
    initialValues: store,
    selectedStoreId: state.stores.selectedStoreId
  }
}
 
export default compose(
  connect(mapStateToProps, { showProgressBar, hideProgressBar }),
  reduxForm({
    form: 'storeGeneralSettings',
    validate,
    onSubmit
  })
)(General);