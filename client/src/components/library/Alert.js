import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { makeStyles, SnackbarContent, IconButton, Snackbar }  from '@material-ui/core';
import { amber, grey } from '@material-ui/core/colors';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationTriangle, faExclamationCircle, faInfoCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { connect } from 'react-redux';
import { clearAlert } from '../../store/actions/alertActions';

const variantIcon = {
  success: faCheckCircle,
  error: faExclamationCircle,
  info: faInfoCircle,
  warning: faExclamationTriangle,
};

const useStyles = makeStyles(theme => ({
  success: {
    backgroundColor: grey[600],
  },
  error: {
    backgroundColor: theme.palette.error.dark,
  },
  info: {
    backgroundColor: theme.palette.primary.main,
  },
  warning: {
    backgroundColor: amber[700],
  },
  icon: {
    fontSize: 20,
  },
  iconVariant: {
    opacity: 0.9,
    marginRight: theme.spacing(1),
  },
  message: {
    display: 'flex',
    alignItems: 'center',
  },
}));

const Alert = (props) => {
  const classes = useStyles();
  const { alert, clearAlert } = props;
  let variant = null;
  for(const key in alert)
    if(alert[key])
      variant = key;
  let timer = useRef();
  useEffect(() => {
    if(variant)
     timer.current = setTimeout(clearAlert, 3000);
    else if(timer.current){
      clearTimeout(timer.current);
      timer.current = null;
    }
    return () => {
      if(timer.current)
      {
        clearTimeout(timer.current);
        timer.current = null;
      }
    }
  }, [timer, clearAlert, variant])
  if(variant === null) return null;
  return (
    <Snackbar
    open={true}
    anchorOrigin={{
      horizontal: "center",
      vertical: "top"
    }}
    >
      <SnackbarContent
        className={classes[variant]}
        aria-describedby="client-snackbar"
        message={
          <span id="client-snackbar" className={classes.message}>
            <FontAwesomeIcon icon={variantIcon[variant]} className={clsx(classes.icon, classes.iconVariant)} />
            { alert.success }
            { alert.error }
            { alert.info }
            { alert.warning }
          </span>
        }
        action={[
          <IconButton key="close" aria-label="close" color="inherit" onClick={clearAlert}>
            <FontAwesomeIcon icon={faTimesCircle} className={classes.icon} />
          </IconButton>,
        ]}
      />
    </Snackbar>
  );
}


const mapStateToProps = state => {
  return{
    alert: state.alert
  }
}

export default connect(mapStateToProps, { clearAlert })(Alert);
