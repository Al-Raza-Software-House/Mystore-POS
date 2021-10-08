export const actionTypes = {
  LOADING: 'loading',
  LOADED: 'loaded'
}

export const showProgressBar = () => ({ type: actionTypes.LOADING })
export const hideProgressBar = () => ({ type: actionTypes.LOADED })

