import axios from 'axios';

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
    axios.get('/api/users/profile').then(({ data }) => {
      if(data.systemVersion && localStorage && localStorage.getItem('systemV') !== data.systemVersion)
        localStorage.removeItem('systemV');
      if(data.user)
        dispatch({
          type: actionTypes.LOADAUTH_SUCCESS,
          user: data.user
        });
    }).catch(err => err); // auto catched in response interceptor
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
