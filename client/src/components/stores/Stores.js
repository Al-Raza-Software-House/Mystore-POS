import React from 'react';
import { connect } from 'react-redux';
import { loadStores } from '../../store/actions/storeActions';
import { Box, Paper, makeStyles, Typography, Button } from '@material-ui/core';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Store from './Store';

const useStyles = makeStyles(theme => ({
  firstStore:{
    minHeight: '50vh',
    margin: 'auto',
    color: '#0d0d0d'
  }
}));

function  Stores({ loadStores, stores, allLoaded, selectedStoreId }) {
  const classes = useStyles();

  useEffect(() => {
      loadStores();
  }, [loadStores]);

  return(
    <Box p={3}>
    {
      stores.length === 0 && allLoaded && 
      <Paper variant="outlined" className={classes.firstStore}>
        <Box p={3} display="flex" justifyContent="center" alignItems="center" flexWrap="wrap" style={{ minHeight: 'inherit' }}>
          <div style={{ textAlign: 'center' }}>
          <Typography variant="h5" style={{ marginBottom: '10px' }} align="center">CREATE YOUR FIRST STORE NOW</Typography>
          <Button disableElevation variant="contained" color="primary"  component={Link} to="/stores/create">CREATE STORE</Button>
          </div>
        </Box>
      </Paper>
    }
    {
      stores.length !== 0 && 
      (
        <>
        <Box width="100%" justifyContent="flex-end" display="flex" mb={2}>
          <Button disableElevation variant="contained" color="primary"  component={Link} to="/stores/create">CREATE NEW STORE</Button>
        </Box>
        <Box display="flex" flexWrap="wrap">
          {
            stores.map(item => (
              <Store store={item} key={item._id} />
            ))
          }
        </Box>
        </>
      )
      
    }
    </Box>
  )
}

const mapStateToProps = (state) => {
  return{
    stores: state.stores.stores,
    allLoaded: state.stores.allLoaded,
    selectedStoreId: state.stores.selectedStoreId
  }
}

export default connect(mapStateToProps, { loadStores })(Stores);