import React, { useCallback, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import PointOfSale from './PointOfSale';


function SaleAndReturn(props){

  const [renderSale, setRenderSale] = useState(true);
  const location = useLocation();
  const history = useHistory()
  
  const cancelSale = useCallback(() => {
    if(location.pathname !== '/sale')
      history.push('/sale');
    setRenderSale(false);
    setTimeout(() => setRenderSale(true), 10);
  }, [location.pathname, history]);
  if(!renderSale) return null;
  return(
    <PointOfSale {...props} cancelSale={cancelSale} />
  )

}

export default SaleAndReturn;