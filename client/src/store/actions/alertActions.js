export const actionTypes = {
  SHOW_SUCCESS: 'showSuccess',
  SHOW_ERROR: 'showError',
  SHOW_INFO: 'showInfo',
  SHOW_WARNING: 'showWarning',
  CLEAR_ALERT: 'clearAlert'
}

export const showSuccess = (message) => ({ type: actionTypes.SHOW_SUCCESS, message })
export const showError = (message) => ({ type: actionTypes.SHOW_ERROR, message })
export const showInfo = (message) => ({ type: actionTypes.SHOW_INFO, message })
export const showWarning = (message) => ({ type: actionTypes.SHOW_WARNING, message })
export const clearAlert = () => ({ type: actionTypes.CLEAR_ALERT })

