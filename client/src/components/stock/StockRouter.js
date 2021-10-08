import React from 'react';
import { makeStyles, Paper, Box } from '@material-ui/core';
import StyledTabs from '../library/StyledTabs';
import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import Categories from './categories/Categories';
import CreateCategory from './categories/CreateCategory';
import EditCategory from './categories/EditCategory';
import Variants from './categories/Variants';
import Properties from './categories/Properties';
import ItemProperties from './itemProperties/ItemProperties';
import CreateItem from './items/CreateItem';
import Items from './items/Items';


const useStyles = makeStyles(theme => ({
  paper:{
    width: 'inherit',
  }
}))

const menues = [
  {to: '/stock', title: 'Items'},
  {to: '/stock/categories', title: 'Categories'},
  {to: '/stock/itemProperties', title: 'Item Properties'},
  {to: '/stock/adjustment', title: 'Adjustment'},
  {to: '/stock/audit', title: 'Audit'},
]

function StockRouter({ loadVideos }){
  const classes = useStyles();

  return(
    <Box display="flex" flexDirection="column" justifyContent="space-between" height="100%">
      <Paper className={classes.paper} square>
        <Box>
          <Box px={3} pt={0}>
            <StyledTabs menues={menues} />
          </Box>
        </Box>
      </Paper>
      <Paper className={classes.paper} style={{flexGrow: 1}} variant="outlined" square>
        <Box px={3} pt={2} >
          <Switch>
            <Route path="/stock/items/create" component={CreateItem} />
            <Route path="/stock/categories/properties/:storeId/:categoryId" component={Properties} />
            <Route path="/stock/categories/variants/:storeId/:categoryId" component={Variants} />
            <Route path="/stock/categories/edit/:storeId/:categoryId" component={EditCategory} />
            <Route path="/stock/categories/create" component={CreateCategory} />
            <Route path="/stock/categories" component={Categories} />
            <Route path="/stock/itemProperties" component={ItemProperties} />
            <Route path="/stock" component={Items} />
          </Switch>
        </Box>
      </Paper>
    </Box>
  )
}

export default connect(null, null)(StockRouter);