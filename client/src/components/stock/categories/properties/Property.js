import React from 'react';
import { makeStyles, List } from '@material-ui/core'
import AddPropertyValue from './AddPropertyValue';
import PropertyValue from './PropertyValue';
import PropertyName from './PropertyName';


const useStyles = makeStyles(theme => ({
  list: {
    border: '2px solid rgba(0,0,0, 0.2)',
    borderRadius: '5px'
  }
}));

function Property({ category, propertyId }){
  const classes = useStyles();
  return(
    <List className={classes.list}>
      <PropertyName {...{ category, propertyId }} />
      {
        category[propertyId].values.map(value => (
          <PropertyValue key={value._id} value={value} storeId={ category.storeId } propertyName={ category[propertyId].name } categoryId={ category._id } propertyId={propertyId} />
        ))
      }
      <AddPropertyValue {...{category, propertyId}} />
    </List>
  )
}




export default Property;