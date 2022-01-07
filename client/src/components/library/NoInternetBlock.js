import { faSync } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, CircularProgress, makeStyles, Typography } from '@material-ui/core';
import React from 'react';
import { connect } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { syncData } from 'store/actions/systemActions';

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
const excludePaths = ['/dashboard', '/sale'];
function NoInternetBlock({ online, pinging, syncData }){
  const classes = useStyles();
  const { pathname } = useLocation();
  if(online) return null;
  if(excludePaths.indexOf(pathname) !== -1) return null;
  return(
    <div className={classes.overlay}>
      <Box mt={10}>
        <Typography align='center'>No internet <br/>Please check your network connection</Typography>

        <Box textAlign="center" mt={4}> 
          <Button variant="contained" disabled={pinging} onClick={syncData} color="primary" startIcon={<FontAwesomeIcon icon={faSync} />}> Try Now</Button>
        </Box>
        <Box mt={2} textAlign="center">
          { pinging ? <CircularProgress size={20} /> : null }
        </Box>
      </Box>
    </div>
  )
}

const mapStateToProps = state => {
    return {
      online: state.system.online,
      pinging: state.system.pinging,
    }
}

export default connect(mapStateToProps, { syncData })(NoInternetBlock);