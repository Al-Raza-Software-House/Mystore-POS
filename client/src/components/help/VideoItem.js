import React, { useState } from 'react';
import { Badge, Box, Dialog, DialogContent, DialogActions, Button, useTheme, useMediaQuery } from '@material-ui/core';

function VideoItem({ video, sidebar=false }) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const handleClose = () => setOpen(false);
  return(
    <>
    <Box onClick={() => setOpen(true)} position="relative" pb={sidebar ? 0 : 1} pr={sidebar ? 0 : { xs: 0, sm: 2 }} width={sidebar ? "100%" : { xs: '100%', sm: '27%', 'md': '29%', lg: '19%' }} style={{ boxSizing: 'border-box', 'cursor' : 'pointer' }}>
      <img src={video.thumbnail} alt={video._id} style={{ width: '100%'}} />
      <Badge style={{ bottom: '14px', right: '26px' }} badgeContent={ video.duration } color="primary" variant="standard" />
    </Box>
    <Dialog fullWidth={true} maxWidth="md" fullScreen={fullScreen}  open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogContent>
          <Box display="flex" alignItems="center" justifyContent="center" height="100%">
            <Box 
            style={{
                  position: "relative",
                  paddingBottom: "56.25%" /* 16:9 */,
                  paddingTop: 25,
                  height: 0,
                  width: '100%'
                }}
            >
              <iframe 
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%"
                }}
                src={ 'https://www.youtube.com/embed/' + video.youtubeId } title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions style={{ justifyContent: 'center' }}>
          <Button disableElevation onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default VideoItem;