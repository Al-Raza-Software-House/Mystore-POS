import { Box } from '@material-ui/core';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useLocation } from 'react-router-dom';
import VideoItem from './VideoItem';
import ReactGA from "react-ga4";

function VideosList({ allVideos }) {
  const { pathname } = useLocation();
  const moduleName = pathname.replace('/help/', '').replace('/help', '');
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: pathname, 'title' : "Help | " + moduleName.toUpperCase() });
  }, [pathname, moduleName]);

  const videos = allVideos.filter(item => item.moduleName === moduleName);
  videos.sort(function(a, b){return a.order - b.order});
  return(
    <Box display="flex" flexWrap="wrap" justifyContent={{ xs: 'center', sm: 'space-between' }}>
      {
        videos.map(item => (
          <VideoItem key={item._id} video={item}/>
        ))
      }
    </Box>
  )
}

const mapStateToProps = state => {
 return{
   allVideos: state.help.videos
 }
}

export default connect(mapStateToProps)(VideosList);