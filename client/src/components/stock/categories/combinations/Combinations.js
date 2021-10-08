import React from 'react';
import { makeStyles, List, ListSubheader } from '@material-ui/core'
import AddCombination from './AddCombination';
import Combination from './Combination';


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

function Combinations({ category }){
  const classes = useStyles();
  return(
    <List className={classes.list}>
      <ListSubheader className={classes.listItem} style={{ fontSize: '18px' }}>Colors</ListSubheader>
      {
        category.combinations.map(combination => (
          <Combination key={combination._id} combination={combination} storeId={ category.storeId }  categoryId={ category._id }/>
        ))
      }
      <AddCombination {...{category}} />
    </List>
  )
}




export default Combinations;