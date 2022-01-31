import React, { useEffect } from 'react';
import { Box, Button } from '@material-ui/core';
import { resetAppState } from '../../store/actions/systemActions';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import ReactGA from "react-ga4";




const SystemSettings = (props) => {
  const history = useHistory();
  const dispatch = useDispatch();
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/store-settings/system", 'title' : "System Settings" });
  }, []);
  const clearCache = () => {
    dispatch( resetAppState() );
    history.push("/stores");
  }
  return (
    <Box width={{ xs: '100%', md: '50%' }} >
      <Button disableElevation onClick={clearCache} variant="contained" color="primary">
        Clear System Cache
      </Button>
    </Box>
  );
}



 
export default React.memo(SystemSettings);