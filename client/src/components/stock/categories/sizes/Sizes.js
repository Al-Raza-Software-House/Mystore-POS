import React from 'react';
import { makeStyles, List, ListSubheader } from '@material-ui/core'
import AddSize from './AddSize';
import Size from './Size';


const useStyles = makeStyles(theme => ({
  list: {
    border: '2px solid rgba(0,0,0, 0.2)',
    borderRadius: '5px'
  },
  listItem:{
    borderBottom: '2px solid rgba(0,0,0, 0.2)',
    textAlign: 'center'
  }
}));

function Sizes({ category }){
  const classes = useStyles();
  return(
    <List className={classes.list}>
      <ListSubheader className={classes.listItem} style={{ fontSize: '18px' }}>Sizes</ListSubheader>
      {
        category.sizes.map(size => (
          <Size key={size._id} size={size} storeId={ category.storeId }  categoryId={ category._id }/>
        ))
      }
      <AddSize {...{category}} />
    </List>
  )
}




export default Sizes;