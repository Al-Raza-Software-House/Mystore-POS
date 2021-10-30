import React, { useEffect } from 'react';
import { CircularProgress, Typography, Dialog, DialogContent, Box } from '@material-ui/core';
import { connect } from 'react-redux';
import { loadMasterData } from '../../store/actions/systemActions';

const MasterData = ({ storeId, masterDataLoaded, syncinProgress, syncStatus, loadMasterData }) => {
  useEffect(() => {
    if(!storeId) return;
    if(!masterDataLoaded)
      loadMasterData()
  }, [storeId, loadMasterData, masterDataLoaded]);
  return (
    <Dialog open={syncinProgress} fullWidth={true}>
      <DialogContent >
        <Box textAlign="center" py={2}>
          <Typography align="center" variant="h6" style={{ marginBottom: 25 }}>Loading store data, please wait....</Typography>
          <CircularProgress color="primary" />
          <Typography align="center" variant="h5" style={{ marginTop: 25 }}>{syncStatus}</Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
 
const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  return{
    storeId,
    masterDataLoaded: storeId ? false : state.system.masterDataLoaded[storeId],
    syncinProgress: state.system.syncinProgress,
    syncStatus: state.system.syncStatus,
  }
}
export default connect(mapStateToProps, { loadMasterData })(MasterData);