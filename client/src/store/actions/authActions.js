import axios from 'axios';
import { showError } from './alertActions';
import { appVersionChanged } from './systemActions';

export const actionTypes = {
  SIGNUP_SUCCESS: 'signUpSuccess',
  LOGIN_SUCCESS: 'loginSuccess',
  LOADAUTH_SUCCESS: 'loadAuthSuccess', // checking state on app load if session already exist

  LOGOUT_SUCCESS: 'logOutSuccess',
  AUTH_FAILED: 'authFailed',

  ACCOUNT_SETTINGS_UPDATED: 'accountSettingsUpdated',
  RESET_PASSWORD_SUCCESS: 'resetPasswordSuccess',
  INIT_RESET_PASSWORD: 'initResetPassword',
  RESET_PASSWORD_WIZARD_UPDATED: 'resetPasswordWizardUpdated',
  SIGNUP_WIZARD_UPDATED: 'signupWizardUpdated'
}

export const loadAuth = () => {
  return (dispatch, getState) => {
    const state = getState();
    axios.get('/api/users/profile').then(({ data }) => {
      if(data.user)
        dispatch({
          type: actionTypes.LOADAUTH_SUCCESS,
          user: data.user
        });
      if(data.appVersion !== state.system.appVersion)
        dispatch( appVersionChanged(data.appVersion) );
    }).catch( err => {
      dispatch( showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    });
  }
}

export const logOut = (msg) => {
  return (dispatch, getState) => {
    dispatch( {
      type: actionTypes.LOGOUT_SUCCESS,
      message: typeof msg === 'string' ? msg : "Logged out, Please login to continue"
    });
  }
}
