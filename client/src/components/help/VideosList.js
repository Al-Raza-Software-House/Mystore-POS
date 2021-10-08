import { Box } from '@material-ui/core';
import React from 'react';
import { connect } from 'react-redux';
import { useLocation } from 'react-router-dom';
import VideoItem from './VideoItem';

function VideosList({ allVideos }) {
  const { pathname } = useLocation();
  const moduleName = pathname.replace('/help/', '').replace('/help', '');
  const videos = allVideos.filter(item => item.moduleName === moduleName);
  videos.sort(function(a, b){return a.order - b.order});
  return(
    <Box display="flex" flexWrap="wrap" justifyContent={{ xs: 'center', sm: 'flex-start' }}>
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