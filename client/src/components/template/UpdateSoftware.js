import React from 'react';
import { Typography, Dialog, DialogContent, Box } from '@material-ui/core';
import { connect } from 'react-redux';

const UpdateSoftware = ({ isAuthLoaded, appVersion }) => {
  
  return (
    <Dialog open={isAuthLoaded && appVersion !== null && appVersion !== process.env.REACT_APP_VERSION} fullWidth={true}>
      <DialogContent >
        <Box textAlign="center" py={2}>
          <Typography align="center" variant="h6" style={{ marginBottom: 25 }}>Software updates are available... </Typography>
          <Typography align="center" variant="h6" style={{ marginBottom: 25 }}>Please software ko re-start krien, 60 seconds wait krein aur phir software re-start krein</Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
 
const mapStateToProps = state => {
  return{
    isAuthLoaded: state.auth.isLoaded,
    appVersion: state.system.appVersion
  }
}
export default connect(mapStateToProps)(UpdateSoftware);