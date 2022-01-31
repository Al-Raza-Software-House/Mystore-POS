import React, { useEffect } from 'react';
import { Button, Box, Typography } from '@material-ui/core'
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLongArrowAltLeft } from '@fortawesome/free-solid-svg-icons';
import { Link, useParams } from 'react-router-dom';
import Sizes from './sizes/Sizes';
import Combinations from './combinations/Combinations';
import ReactGA from "react-ga4";




function Variants(props) {
  const { storeId, categoryId } = useParams();
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/stock/categories/variants", 'title' : "Category Variants" });
  }, []);

  const category = useSelector( state =>  state.categories[storeId].find(item => item._id === categoryId) );
  
    return(
      <>
      <Box width="100%" justifyContent="flex-end" display="flex">
        <Button disableElevation color="primary" startIcon={<FontAwesomeIcon icon={faLongArrowAltLeft} />} component={Link} to="/stock/categories">
          Categories
        </Button>
      </Box>
      <Box margin="auto" mb={2} width={{ xs: '100%', md: '50%' }}>
        <Typography gutterBottom variant="h6" align="center">{ category.name } Variants</Typography>
      </Box>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" margin="auto" width={{ xs: '100%', md: '50%' }} flexWrap="wrap">
        <Box width={{ xs: '100%', md: '48%' }} mb={3} textAlign="center">
          <Sizes category={category} />
        </Box>
        <Box width={{ xs: '100%', md: '48%' }} mb={3}>
          <Combinations category={category} />
        </Box>
      </Box>
      </>
    )
}

export default Variants;