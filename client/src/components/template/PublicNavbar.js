import React from 'react';
import { Toolbar, AppBar, makeStyles, Box, Typography, LinearProgress, IconButton } from '@material-ui/core';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

const useStyles = makeStyles(theme => ({
  root:{
    backgroundColor: '#fff',
    boxShadow: "0px 1px 4px 1px rgba(0, 0, 0, 0.12)",
    color: "#606060"
  },
  logo: {
    flexGrow: 1
  },
  toolbar:{
    display: "flex",
    justifyContent: 'space-between',
    color: '#606060'
  },
  progressContainer:{
    height: '4px'
  }
}));

const PublicNavbar = ({progressBar, showHelp}) => {
  const classes = useStyles();
  return (
    <Box mb={{ xs: 2, sm : 1 }}>
      <AppBar position="static" className={classes.root}>
          <Toolbar className={classes.toolbar}>
            <Typography variant="h6" noWrap>{process.env.REACT_APP_NAME}</Typography>
            <IconButton
              onClick={() => showHelp(true)}
              edge="start"
              title="Help"
            >
              <FontAwesomeIcon icon={faQuestionCircle} size="xs" />
            </IconButton>
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