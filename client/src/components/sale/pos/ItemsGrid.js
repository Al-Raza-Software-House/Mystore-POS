import React from 'react'
import { Box, ButtonBase, Paper, Typography, useMediaQuery } from '@material-ui/core';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { useMemo } from 'react';
import { makeStyles } from '@material-ui/styles';
import ItemImage from 'components/library/ItemImage';

function ItemsGrid({ selectItem, disabled }){
  const storeId = useSelector(state => state.stores.selectedStoreId);
  let items = useSelector(state => state.items[storeId].allItems );
  const favoriteItems = useMemo(() => {
    return items.filter(record => record.isFavorite)
  }, [items]);

  return(
    <Box display="flex" flexDirection="column" flexGrow={1} style={{ overflowY: "auto" }} maxWidth="45vw" height="60vh">
      <Box flexGrow={1} width="100%" height="100%" px={2} py={1} borderRadius={5} style={{ boxSizing: "border-box" }} display="flex" justifyContent="space-between" flexWrap="wrap" alignItems="flex-start" alignContent="flex-start">
        {
          favoriteItems.map(item => (
            <Item item={item} key={item._id} selectItem={selectItem} disabled={disabled} />
          ))
        }
        {
          favoriteItems.length !== 0 ? null :
          <Box width='100%' height="100%" display="flex" justifyContent="center" alignItems="center">
            <Typography align="center">No favorite items found</Typography>
          </Box>
        }
      </Box>
    </Box>
  )
}

const useStyles = makeStyles(theme => ({
  root:{
    "&:hover":{
      boxShadow: "0px 0px 5px 3px rgba(33, 150, 243, 0.98)"
    }
  }
}))

function Item({ item, selectItem, disabled }){
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('sm'), { noSsr: true });
  const classes = useStyles();
  return(
    <ButtonBase style={{ boxSizing: "border-box", width: isDesktop ? "32%" : "48%", cursor: "pointer", marginBottom: "8px" }} onClick={() => selectItem(item)} disabled={disabled}>
      <Paper style={{ width: "100%" }}  elevation={3} className={classes.root}>
        <Box p={1}>
          <Typography title={item.itemName} align="center" style={{ fontSize: 12, fontWeight: "bold", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}> {item.itemName}  </Typography>
          
          <Box style={{ color: '#2196f3', fontSize: 12, textAlign: "center"  }} display="flex" justifyContent="space-between" alignItems="center" > 
            <span>{ item.packParentId ? <span style={{ color: '#7c7c7c' }} title={`Pack of ${item.packQuantity}`}><FontAwesomeIcon icon={faBoxOpen} /> </span> : null }</span>
            Price: { item.packParentId ? item.packSalePrice.toLocaleString() : item.salePrice.toLocaleString() }  
            <span>
              <ItemImage item={item} showButton={false} />
            </span>
          </Box>
          <Typography style={{ color: '#7c7c7c',  fontSize: 12  }} align="center"> {item.itemCode}{item.sizeCode ? '-'+item.sizeCode+'-'+item.combinationCode : '' } </Typography>
          
        </Box>
      </Paper>
    </ButtonBase>
  )
}

export default React.memo(ItemsGrid);