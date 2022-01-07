import { Box, Button, makeStyles, Typography } from '@material-ui/core';
import moment from 'moment';
import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';

const useStyles = makeStyles(theme => ({
  overlay: {
    position: 'absolute',
    top: 8*8+4,
    left: '0px',
    width: '100%',
    height: 'calc(100% - 68px)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: theme.zIndex.modal + 400,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start"
  }
}))
const excludePaths = ['/dashboard', '/reports', '/store-settings', '/billing', '/stores', '/help'];
function AppExpiredBlock({ store }){
  const classes = useStyles();
  const { pathname } = useLocation();
  const isExpired = useMemo(() => {
    const now = moment();
    const expiry = moment(store.expiryDate);
    if(now.isAfter( expiry ))
      return true;
    return false;
  }, [store])
  const isPathExcluded = useMemo(() => {
    let exculded = false;
    excludePaths.forEach(record => {
      if(pathname.startsWith(record))
        exculded = true;
    })
    return exculded;
  }, [pathname]);
  if(!isExpired || isPathExcluded) return null;
  return(
    <div className={classes.overlay}>
      <Box mt={10}>
        <Typography align='center'>
          Your subscription for <b>{ store.name }</b> has been expired on <span style={{fontSize: 22, fontWeight: 'bold'}}>{ moment(store.expiryDate).format('D MMMM, YYYY hh:mm A') }</span>
          <br/>
          <br/>
          <span>Please extend your subscription to keep using { process.env.REACT_APP_NAME }</span>
        </Typography>

        <Box mt={4} textAlign="center">
          <Button variant="contained" color="primary" component={Link} to="/billing" >
            Billing
          </Button>
        </Box>
      </Box>
    </div>
  )
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  let store = null;
  if(storeId)
    store = state.stores.stores.find(item => item._id === storeId);
    return {
      store
    }
}

export default connect(mapStateToProps)(AppExpiredBlock);