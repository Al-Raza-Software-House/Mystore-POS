import React, { useState, useRef, useEffect } from 'react';
import { makeStyles, Collapse, Button, Box, Typography, FormHelperText } from '@material-ui/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLongArrowAltLeft } from '@fortawesome/free-solid-svg-icons';
import { Field, initialize, reduxForm, SubmissionError } from 'redux-form';
import axios from 'axios';
import PasswordField from '../library/form/PasswordField';
import TextInput from '../library/form/TextInput';
import RadioInput from '../library/form/RadioInput';
import { showProgressBar, hideProgressBar } from '../../store/actions/progressActions';
import {  storesStampChanged, updateStore } from '../../store/actions/storeActions';
import { userTypes } from '../../utils/constants';
import { connect } from 'react-redux';
import { Link, useHistory } from 'react-router-dom';
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
function AddUser({ id, myRole }) {
  const history = useHistory();
  const [wizard, setWizard] = useState({
    phone: true,
    verification: false,
    password: false
  });

  const closeDialog = () => {
    history.push('/store-settings/users')
  }

  return(
    <>
    <Box width="100%" justifyContent="flex-end" display="flex">
      <Button disableElevation color="primary" startIcon={<FontAwesomeIcon icon={faLongArrowAltLeft} />} component={Link} to="/store-settings/users">
        All Users
      </Button>
    </Box>
    <Box margin="auto" width={{ xs: '100%', md: '50%' }}>
      <Typography gutterBottom align="center" variant="h6">Add new user to store</Typography>
      <AddUserForm { ...{myRole, id, wizard, setWizard, closeDialog}} />
    </Box>
    </>
  )
  
}

function UserForm(props){
  const { myRole, wizard, handleSubmit, pristine, submitting, error, invalid, dirty } = props;
  const classes = useStyles();
  useEffect(() => {
    if(wizard.userAdded)
      handleSubmit();
  }, [wizard, handleSubmit]);

  const codeInputRef = useRef();
  const passwordInputRef = useRef();

  useEffect(() => {
    if(wizard.password)
      passwordInputRef.current && passwordInputRef.current.focus();
  }, [wizard.password])

  useEffect(() => {
    if(wizard.verification)
      codeInputRef.current && codeInputRef.current.focus();
  }, [wizard.verification])


  if(myRole === userTypes.USER_ROLE_MANAGER)
    userRoles = userRoles.filter(item => item.id !== userTypes.USER_ROLE_OWNER) //manager cannot add another owner
  return(
    <form onSubmit={handleSubmit}>
      <Collapse in={wizard.phone}>
        <Box mb={2}>
          <Field
            component={RadioInput}
            options={userRoles}
            label="User Role"
            id="userRole"
            name="userRole"
          />
        </Box>
        <Box>
          <Field
          component={TextInput}
          id="name"
          name="name"
          label="User Name"
          placeholder="user full name"
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
            label="User Mobile Number"
            placeholder="Please enter user's mobile number 03011234567"
            type="text"
            fullWidth={true}
            variant="outlined"
          />
        </Box>
      </Collapse>
      
      <Collapse in={wizard.verification}>
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
              A SMS with 6 digit verification code has been sent to user mobile number
            </FormHelperText>
        </Box>
      </Collapse>

      <Collapse in={wizard.password || wizard.userAdded}>
        <Box>
          <PasswordField inputRef={passwordInputRef} />
          <FormHelperText>
              Please choose a password for user account
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
  )
}

const onSubmit = (values, dispatch, { id, wizard, setWizard, closeDialog }) => {
  values.id = id;
  if(wizard.phone || wizard.userAdded) //very first request or after new user created via signup
  {
    dispatch(showProgressBar());
    return axios.post('/api/stores/adduser', values).then( response => {
      dispatch(hideProgressBar());
      if(response.data.newUser) //user not exist, create it first with signup
      {
        return signUp(values, dispatch, { wizard, setWizard });
      }else if(response.data.store._id)
      {
        dispatch(updateStore(id, response.data.store));
        dispatch( storesStampChanged(id, response.data.now) );
        dispatch( showSuccess("User added to store") );
        closeDialog();
      }

    }).catch(err => {
      dispatch(hideProgressBar());
      throw new SubmissionError({
        _error: err.response && err.response.data.message ? err.response.data.message: err.message
      });
    });
  }else // verification or password setup of signup
  {
    return signUp(values, dispatch, { wizard, setWizard });
  }
}

//create new user
const signUp = (values, dispatch, { wizard, setWizard })  => {
  const user = {
    name: values.name,
    phone: values.phone
  };
  user.phone = user.phone.replace(/-/g, '');
  if(!user.phone.startsWith('0'))
    user.phone = '0'+user.phone;
  if(wizard.verification || wizard.password)
    user.pin = values.pin;
  if(wizard.password)
    user.password = values.password;
  dispatch(showProgressBar());
  return axios.post('/api/users/signup', user).then( response => {
    dispatch(hideProgressBar());      
    dispatch(initialize('addUserToStore', values));//make form pristine(not touched) 
      const newWizard = {
      phone: false,
      verification: false,
      password: false
    };
    if(wizard.phone) newWizard.verification = true;
    if(wizard.verification) newWizard.password = true;
    if(wizard.password) newWizard.userAdded = true;
    setWizard(newWizard);
  }).catch(err => {
    dispatch(hideProgressBar());
    throw new SubmissionError({
      _error: err.response && err.response.data.message ? err.response.data.message: err.message
    });
  })
}

const validate = (values, props) => {
  const { dirty, wizard } = props;
  if(!dirty) return {};
  const errors = {};
  const required = ['userRole', 'name', 'phone'];
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
  if(wizard.verification && !values.pin)
    errors.pin = "verification code is required";
  if(values.pin && values.pin.length !== 6)
    errors.pin = "verification code must be 6 digits";
  if(values.pin && isNaN(values.pin))
    errors.pin = "verification code must be numbers";

  if(wizard.password && !values.password)
    errors.password = "password is required";
  if(values.password && values.password.length < 6)
    errors.password = "Password should be at least 6 characters";
  return errors;
}

const AddUserForm = reduxForm({
  'form': 'addUserToStore',
  validate,
  onSubmit,
  initialValues: { userRole: userTypes.USER_ROLE_MANAGER }
})(UserForm);

const mapStateToProps = state => {
  return {
    id: state.stores.selectedStoreId,
    myRole: state.stores.userRole
  }
}

export default connect(mapStateToProps)(AddUser);//to Provide dispatch to parent