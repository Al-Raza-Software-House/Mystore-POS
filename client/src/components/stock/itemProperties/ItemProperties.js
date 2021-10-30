import React from 'react';
import { Box, Typography } from '@material-ui/core'
import { useSelector } from 'react-redux';
import Property from './Property';

function ItemProperties() {

  const { properties } = useSelector( state =>  ({
      storeId: state.stores.selectedStoreId,
      properties: state.itemProperties[state.stores.selectedStoreId] ? state.itemProperties[state.stores.selectedStoreId] : {}
    }) );
  
    return(
      <>
      <Box margin="auto" mb={2} width={{ xs: '100%', md: '50%' }}>
        <Typography gutterBottom variant="h6" align="center">Item Properties</Typography>
      </Box>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" margin="auto" width="100%" flexWrap="wrap">
        
        <Box width={{ xs: '100%', md: '24%' }} mb={3} textAlign="center">
          { properties['property1'] && <Property properties={properties} propertyId="property1" /> }
        </Box>
        <Box width={{ xs: '100%', md: '24%' }} mb={3}>
          { properties['property2'] && <Property properties={properties} propertyId="property2" /> }
        </Box>

        <Box width={{ xs: '100%', md: '24%' }} mb={3} textAlign="center">
          { properties['property3'] && <Property properties={properties} propertyId="property3" /> }
        </Box>
        <Box width={{ xs: '100%', md: '24%' }} mb={3}>
          { properties['property4'] && <Property properties={properties} propertyId="property4" /> }
        </Box>

      </Box>
      </>
    )
}

export default ItemProperties;