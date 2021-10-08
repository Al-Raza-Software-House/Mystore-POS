import { makeStyles } from '@material-ui/core';
import React from 'react';
import { connect } from 'react-redux';

const useStyles = makeStyles(theme => ({
  overlay: {
    position: 'absolute',
    top: 8*8+4,
    left: '0px',
    width: '100%',
    height: 'calc(100% - 68px)',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    zIndex: theme.zIndex.modal + 400
  }
}))

function InterfaceBlock({ loading }){
  const classes = useStyles();
  if(!loading) return null;
  return(
    <div className={classes.overlay}></div>
  )
}

const mapStateToProps = state => {
    return {
      loading: state.progressBar.loading
    }
}

export default connect(mapStateToProps)(InterfaceBlock);