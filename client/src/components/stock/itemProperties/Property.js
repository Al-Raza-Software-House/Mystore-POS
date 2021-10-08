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

function Property({ properties, propertyId }){
  const classes = useStyles();
  return(
    <List className={classes.list}>
      <PropertyName {...{ properties, propertyId }} />
      {
        properties[propertyId].values.map(value => (
          <PropertyValue key={value._id} value={value} storeId={ properties.storeId } propertyId={propertyId} propertyName={ properties[propertyId].name } />
        ))
      }
      <AddPropertyValue {...{properties, propertyId}} />
    </List>
  )
}




export default Property;