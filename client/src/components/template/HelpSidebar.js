import React, { useMemo } from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Button, Drawer, List, ListItem, Typography } from '@material-ui/core';

import { connect } from 'react-redux';
import { useLocation } from 'react-router-dom';
import VideoItem from 'components/help/VideoItem';

const drawerWidth = 256;

const useStyles = makeStyles((theme) => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    overflowX: 'hidden'
  },
  paper:{
    color: '#606060',
    fontWeight: '500',
    fontSize: '15px',
    justifyContent: "space-between"
  },
  drawerOpen: {
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: drawerWidth,
    },
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.easeIn,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerClose: {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
    width: '0px',
  },
  toolbar: {
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar, //sets min-height to component to force the content appear below the app bar
  }
}));



const formatURL = (pathname) => {
  const paths = ['/editpayment', '/edit', '/view', '/ledger', '/categories/properties', '/categories/variants', '/makepayment', '/receivepayment'];
  for(let i=0; i < paths.length; i++)
  {
    let path = paths[i];
    if(pathname.indexOf( path ) !== -1)
      return pathname.substring(0, pathname.indexOf( path )) + path; //remove dynamic object Ids from URL
  }
  return pathname;
}


function HelpSidebar({ open, setOpen, allVideos}) {
  const classes = useStyles();
  const { pathname } = useLocation();
  
  const currentURL = useMemo(() => {
    return formatURL(pathname);
  }, [pathname])
  
  const videos = useMemo(() => {
    const screen_videos = allVideos.filter(video => video.screens.indexOf(currentURL) !== -1);
    screen_videos.sort((a, b) => {
      const aIndex = a.screens.indexOf(currentURL);
      const bIndex = b.screens.indexOf(currentURL);
      if(aIndex !== bIndex) return aIndex - bIndex;
      return a.order - b.order
    });
    return screen_videos;
  }, [allVideos, currentURL]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={() => setOpen(false)}
      className={clsx(classes.drawer, {
        [classes.drawerOpen]: open,
        [classes.drawerClose]: !open,
      })}
      classes={{
        paper: clsx(classes.paper,  {
          [classes.drawerOpen]: open,
          [classes.drawerClose]: !open,
        }),
      }}
    >
      <Box>
        {
          videos.length ? 
          <Box mt={3}>
            <Typography align="center" variant="h6">Help Videos</Typography>
          </Box>
          :
          <Box mt={3}>
            <Typography align="center">No videos found for this page</Typography>
          </Box>
        }
        <List>
          {videos.map((video, index) => (
            <ListItem button key={video._id} >
              <VideoItem  video={video} sidebar={true}/>
            </ListItem>
          ))}

        </List>
        <Box textAlign="center" width="100%" mb={2}>
          <Button variant="outlined" color="primary" onClick={() => setOpen(false)} >Close</Button>
        </Box>
      </Box>
    </Drawer>
  );
}


const mapStateToProps = (state) => {
  return {
   uid: state.auth.uid,
   storeId: state.stores.selectedStoreId,
   allVideos: state.help.videos
  }
}


export default React.memo(connect(mapStateToProps, null)(HelpSidebar));