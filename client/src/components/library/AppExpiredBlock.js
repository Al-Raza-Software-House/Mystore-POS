import { Box, Button, makeStyles, Typography } from '@material-ui/core';
import VideoItem from 'components/help/VideoItem';
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
    zIndex: theme.zIndex.modal - 1 ,
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    flexDirection: "column",
    alignItems: "center"
  }
}))
const excludePaths = ['/dashboard', '/reports', '/store-settings', '/billing', '/stores', '/help'];
function AppExpiredBlock({ store, helpVideo }){
  const classes = useStyles();
  const { pathname } = useLocation();
  const isExpired = useMemo(() => {
    if(!store) return false;
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
          Your license for <b>{ store.name }</b> has been expired on <span style={{fontSize: 22, fontWeight: 'bold'}}>{ moment(store.expiryDate).format('D MMMM, YYYY hh:mm A') }</span>
          <br/>
          <br/>
          <span>Please extend your license to keep using { process.env.REACT_APP_NAME }</span>
        </Typography>

        <Box mt={4} textAlign="center">
          <Button variant="contained" color="primary" component={Link} to="/billing" >
            Billing
          </Button>
        </Box>
      </Box>
      <Box display="flex" alignItems="center" flexDirection="column" mt={7} width="100%">
        <Typography gutterBottom style={{fontWeight: "bold", color: "#606060"}}> Help Video </Typography>
        {
          helpVideo ?  <VideoItem video={helpVideo} /> : null
        }
      </Box>
    </div>
  )
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  let store = null;

  const allVideos = state.help.videos ? state.help.videos : [];
  const billingVideo = allVideos.find(item => item.moduleName === 'billing');

  if(storeId)
    store = state.stores.stores.find(item => item._id === storeId);
    return {
      store,
      helpVideo: billingVideo ? billingVideo : null
    }
}

export default connect(mapStateToProps)(AppExpiredBlock);