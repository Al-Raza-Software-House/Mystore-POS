import { actionTypes } from '../actions/authActions';
const resetPasswordWizard = {
  phone: true,
  verification: false,
  password: false
}

const signupWizard = {
  phone: true,
  verification: false,
  password: false
}

const initState = {
  uid: null,
  account: {},
  token: null,
  isLoaded: false,
  resetPasswordWizard,
  signupWizard
}

const authReducer = (state = initState, action) => {
  switch(action.type)
  {
    case actionTypes.AUTH_FAILED: //axios interceptors - token doesn' exist or not valid any more
    case actionTypes.LOGOUT_SUCCESS: //User logging out
      return {
        ...state,
        uid: null,
        account: {},
        token: null,
        isLoaded: true
      }
    case actionTypes.SIGNUP_SUCCESS:
    case actionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        uid: action.payload.user._id,
        account: action.payload.user,
        token: action.payload.token,
        isLoaded: true
      }  
    case actionTypes.LOADAUTH_SUCCESS:
      return {
        ...state,
        uid: action.user._id,
        account: action.user,
        isLoaded: true,
      }  
    case actionTypes.ACCOUNT_SETTINGS_UPDATED:
      return {
        ...state,
        account: action.data
      }
    case actionTypes.RESET_PASSWORD_SUCCESS:
      return { 
        ...state,
        resetPasswordWizard
      };
    case actionTypes.INIT_RESET_PASSWORD:
      return {
        ...state,
        success: null,
        error: null,
        resetPasswordWizard,
      }
    case actionTypes.RESET_PASSWORD_WIZARD_UPDATED:
      return {
        ...state,
        resetPasswordWizard: action.payload
      }
    case actionTypes.SIGNUP_WIZARD_UPDATED:
      return {
        ...state,
        signupWizard: action.payload
      }
    default:
      return state;
  }
}

export default authReducer;