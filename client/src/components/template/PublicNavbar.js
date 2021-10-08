import React from 'react';
import { Toolbar, AppBar, makeStyles, Box, Typography, LinearProgress } from '@material-ui/core';
import { connect } from 'react-redux';

const useStyles = makeStyles(theme => ({
  root:{
    backgroundColor: '#fff',
    boxShadow: "0px 1px 4px 1px rgba(0, 0, 0, 0.12)"
  },
  logo: {
    flexGrow: 1
  },
  toolbar:{
    display: "flex",
    justifyContent: 'space-between',
    color: '#0d0d0d'
  },
  progressContainer:{
    height: '4px'
  }
}));

const PublicNavbar = ({progressBar}) => {
  const classes = useStyles();
  return (
    <Box mb={{ xs: 2, sm : 1 }}>
      <AppBar position="static" className={classes.root}>
          <Toolbar className={classes.toolbar}>
            <Typography style={{fontSize: '24px'}} component="h1">{process.env.REACT_APP_NAME}</Typography>
          </Toolbar>
      </AppBar>
      <Box className={classes.progressContainer}>
        { progressBar.loading && <LinearProgress  /> }
      </Box>      
    </Box>
  );
}

const mapStateToProps = state => {
  return {
    progressBar: state.progressBar
  }
}
 
export default connect(mapStateToProps)(PublicNavbar);