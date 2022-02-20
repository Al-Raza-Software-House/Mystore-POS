import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { reduxForm, Field, SubmissionError, initialize } from 'redux-form';
import { Box, makeStyles, Button } from '@material-ui/core';
import FormMessage from '../library/FormMessage';
import {  storesStampChanged, updateStore } from '../../store/actions/storeActions';
import axios from 'axios';
import { showProgressBar, hideProgressBar } from '../../store/actions/progressActions';
import SwitchInput from '../library/form/SwitchInput';
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

const Configuration = (props) => {
  const classes = useStyles();
  const { handleSubmit, pristine, submitting, error, invalid } = props;
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/store-settings/configuration", 'title' : "Configuration" });
  }, [])
  return (
    <Box width={{ xs: '100%', md: '50%' }} >
      <form onSubmit={handleSubmit} >
        <Box mb={2} width={{ xs: '100%', md: '50%' }} margin="auto" >
          <Field component={SwitchInput} name="allowNegativeInventory" label="Allow Negative Stock Sales" />    
        </Box>

        <Box mb={2} width={{ xs: '100%', md: '50%' }} margin="auto" >
          <Field component={SwitchInput} name="weightedCostPrice" label="Use Weighted Average Cost Price on GRN" />    
        </Box>

        <Box mb={2} width={{ xs: '100%', md: '50%' }} margin="auto" >
          <Field component={SwitchInput} name="forceBatchesOnGrn" label="Force Batches on GRN" />    
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
  return axios.post('/api/stores/configuration', { id: selectedStoreId,  configuration: values}).then( response => {
    hideProgressBar();
    if(response.data.store._id)
    {
      dispatch( updateStore(selectedStoreId, response.data.store) );
      dispatch( storesStampChanged(selectedStoreId, response.data.now) );
      dispatch( initialize('storeConfiguration', values) );
      dispatch( showSuccess("Configuration updated") );
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
  return errors;
}



const mapStateToProps = (state) => {
  const store = state.stores.stores.find(item => item._id === state.stores.selectedStoreId);
  return {
    initialValues: store.configuration,
    selectedStoreId: state.stores.selectedStoreId
  }
}
 
export default compose(
  connect(mapStateToProps, { showProgressBar, hideProgressBar }),
  reduxForm({
    form: 'storeConfiguration',
    validate,
    onSubmit
  })
)(Configuration);