import React from 'react';
import { Button, Box, Typography } from '@material-ui/core'
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLongArrowAltLeft } from '@fortawesome/free-solid-svg-icons';
import { Link, useParams } from 'react-router-dom';
import Property from './properties/Property';

function Properties(props) {
  const { storeId, categoryId } = useParams();
  const category = useSelector( state =>  state.categories[storeId].find(item => item._id === categoryId) );
  
    return(
      <>
      <Box width="100%" justifyContent="flex-end" display="flex">
        <Button disableElevation color="primary" startIcon={<FontAwesomeIcon icon={faLongArrowAltLeft} />} component={Link} to="/stock/categories">
          Categories
        </Button>
      </Box>
      <Box margin="auto" mb={2} width={{ xs: '100%', md: '50%' }}>
        <Typography gutterBottom variant="h6" align="center">{ category.name } Properties</Typography>
      </Box>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" margin="auto" width="100%" flexWrap="wrap">
        
        <Box width={{ xs: '100%', md: '24%' }} mb={3} textAlign="center">
          <Property category={category} propertyId="property1" />
        </Box>
        <Box width={{ xs: '100%', md: '24%' }} mb={3}>
          <Property category={category} propertyId="property2" />
        </Box>

        <Box width={{ xs: '100%', md: '24%' }} mb={3} textAlign="center">
          <Property category={category} propertyId="property3" />
        </Box>
        <Box width={{ xs: '100%', md: '24%' }} mb={3}>
          <Property category={category} propertyId="property4" />
        </Box>

      </Box>
      </>
    )
}

export default Properties;