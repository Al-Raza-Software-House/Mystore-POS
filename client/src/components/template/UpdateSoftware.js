import React from 'react';
import { Typography, Dialog, DialogContent, Box } from '@material-ui/core';
import { connect } from 'react-redux';
import VideoItem from 'components/help/VideoItem';

const UpdateSoftware = ({ isAuthLoaded, appVersion, helpVideo }) => {
  
  return (
    <Dialog open={isAuthLoaded && appVersion !== null && appVersion !== process.env.REACT_APP_VERSION} fullWidth={true}>
      <DialogContent >
        <Box textAlign="center" py={2}>
          <Typography align="center" variant="h6" style={{ marginBottom: 25 }}>Software updates are available... </Typography>
          <Typography align="center" variant="h6" style={{ marginBottom: 25 }}>Please software ko re-start krien, 60 seconds wait krein aur phir software re-start krein</Typography>
        </Box>
        <Typography gutterBottom style={{fontWeight: "bold", color: "#606060"}} align="center"> Help Video </Typography>
        <Box display="flex" alignItems="center" flexDirection="column" mt={0} width="50%" mx="auto">
          {
            helpVideo ?  <VideoItem video={helpVideo} sidebar={true} /> : null
          }
        </Box>
      </DialogContent>
    </Dialog>
  );
}
 
const mapStateToProps = state => {
  const allVideos = state.help.videos ? state.help.videos : [];
  const helpVideo = allVideos.find(item => item.youtubeId === process.env.REACT_APP_VERSION_UPDATE_HELP_VIDEO);
  return{
    isAuthLoaded: state.auth.isLoaded,
    appVersion: state.system.appVersion,
    helpVideo
  }
}
export default connect(mapStateToProps)(UpdateSoftware);