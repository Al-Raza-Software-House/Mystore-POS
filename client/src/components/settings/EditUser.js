import React, { useEffect } from 'react';
import { makeStyles,  Button, Box, Typography, FormHelperText } from '@material-ui/core'
import { Field, initialize, reduxForm, SubmissionError } from 'redux-form';
import axios from 'axios';
import RadioInput from '../library/form/RadioInput';
import { showProgressBar, hideProgressBar } from '../../store/actions/progressActions';
import {  updateStore } from '../../store/actions/storeActions';
import { userTypes } from '../../utils/constants';
import { showSuccess } from '../../store/actions/alertActions';

let userRoles = [
  { id: userTypes.USER_ROLE_OWNER, title: "Owner" },
  { id: userTypes.USER_ROLE_MANAGER, title: "Manager" },
  { id: userTypes.USER_ROLE_SALESPERSON, title: "sales Person" },
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

//Dialog


function EditUser(props){
  const { myRole, dispatch, item, handleSubmit, pristine, submitting, error, invalid, dirty } = props;
  const classes = useStyles();
  useEffect(() => {
    dispatch(initialize('editUserToStore', { userRole: item.userRole }));
  }, [dispatch, item.userRole]);

  if(myRole === userTypes.USER_ROLE_MANAGER)
    userRoles = userRoles.filter(item => item.id !== userTypes.USER_ROLE_OWNER) //manager cannot add another owner
  return(
    <Box p={3}>
      <Typography gutterBottom align="center">Update role of <b>{item.record.name}</b></Typography>
      <form onSubmit={handleSubmit}>
        <Box mb={2}>
          <Field
            component={RadioInput}
            options={userRoles}
            label=""
            id="userRole"
            name="userRole"
          />
        </Box>
        
        <Box textAlign="center">
          <Button disableElevation type="submit" variant="contained" color="primary" disabled={pristine || submitting || invalid || !dirty} >
            Update
          </Button>
          {  
            <FormHelperText className={classes.formError} error={true} style={{visibility: !submitting && error ? 'visible' : 'hidden' }}>
              <Typography component="span">{ error ? error : 'Invalid request' }</Typography>
            </FormHelperText>  
          }
        </Box>
      </form>
    </Box>
  )
}

const onSubmit = (values, dispatch, { storeId, item, handleClose }) => {
  values.storeId = storeId;
  values.userId = item.userId;
  dispatch(showProgressBar());
  return axios.post('/api/stores/updateUser', values).then( response => {
    dispatch(hideProgressBar());
    if(response.data._id)
    {
      dispatch(updateStore(storeId, response.data));
      dispatch( showSuccess("User role updated") );
      handleClose();
    }

  }).catch(err => {
    dispatch(hideProgressBar());
    throw new SubmissionError({
      _error: err.response && err.response.data.message ? err.response.data.message: err.message
    });
  });
}


const validate = (values, props) => {
  const errors = {};
  if(!values.userRole)
    errors.userRole = "Role is required";
  return errors;
}

export default reduxForm({
  'form': 'editUserToStore',
  validate,
  onSubmit
})(EditUser);
