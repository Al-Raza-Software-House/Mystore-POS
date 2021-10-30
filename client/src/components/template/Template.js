import React, { useState, useEffect } from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { Box, AppBar, Toolbar, Typography, IconButton, useMediaQuery, LinearProgress } from '@material-ui/core';
import { BrowserRouter as Router, Redirect } from 'react-router-dom';
import AccountMenu from './AccountMenu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import Sidebar from './Sidebar';
import Content from './Content';
import { connect } from 'react-redux';
import Alert from '../library/Alert';
import MasterData from './MasterData';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    height: '100%'
  },
  appBar: {
    backgroundColor: '#fff',
    boxShadow: "0px 1px 4px 1px rgba(0, 0, 0, 0.12)",
    zIndex: theme.zIndex.drawer + 1,
    color: "#606060",
    display: 'flex'
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  toolbar: {
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar, //sets min-height to component to force the content appear below the app bar
  },
  progressContainer:{
    height: '4px',
    width: '100%',
    zIndex: theme.zIndex.drawer + 1,
    pointerEvents: 'none',
    position: 'fixed'
  }
}));

function Template({ uid, progressBar, storeName }) {
  useEffect(() => {
     document.title = process.env.REACT_APP_NAME;
  }, []);
  const classes = useStyles();
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('sm'), { noSsr: true });
  const [open, setOpen] = useState(isLargeScreen);
  const toggleDrawer = () =>  setOpen(open => (!open)) 
  if(!uid) return <Redirect to="/signin" />
  return (
    <Router>
      <div className={classes.root}>
        
        <AppBar position="fixed" className={classes.appBar}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              edge="start"
              className={classes.menuButton}
            >
              <FontAwesomeIcon icon={faBars} size="xs" />
            </IconButton>
            {
              !isLargeScreen && storeName ? null :
              <Typography variant="h6" noWrap>
                {process.env.REACT_APP_NAME}
              </Typography>
            }
            {
              storeName && 
              <Typography align="right" style={{ flexGrow: 1 }} variant="h6" noWrap>
                {storeName}
              </Typography>
            }
            <Box flexGrow={1} textAlign="right">
              <AccountMenu />
            </Box>
          </Toolbar>
        </AppBar>
        <Alert />
        <Box className={classes.progressContainer}>
          <div className={classes.toolbar} />
          { progressBar.loading && <LinearProgress  /> }
        </Box> 

        <Sidebar open={open} setOpen={setOpen} isLargeScreen={isLargeScreen}/>
        <Content />
        <MasterData />
      </div>
    </Router>
  );
}


const mapStateToProps = (state) => {
  const selectedStoreId = state.stores.selectedStoreId;
  let storeName = null;
  if(state.stores.stores.length > 1 && selectedStoreId)
  {
    const store = state.stores.stores.find(item => item._id === state.stores.selectedStoreId);
    storeName = store.name;
  }
  return {
   uid: state.auth.uid,
   progressBar: state.progressBar,
   storeName: storeName 
  }
}

export default connect(mapStateToProps)(Template);