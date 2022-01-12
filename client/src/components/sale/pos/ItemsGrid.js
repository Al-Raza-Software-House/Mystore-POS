import React, { useState } from 'react'
import { Box, ButtonBase, Paper, Typography, useMediaQuery } from '@material-ui/core';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import Pagination from '@material-ui/lab/Pagination';
import { useMemo } from 'react';
import { makeStyles } from '@material-ui/styles';
import ItemImage from 'components/library/ItemImage';
const rowsPerPage = 12;

function ItemsGrid({ selectItem, disabled }){
  const storeId = useSelector(state => state.stores.selectedStoreId);
  let items = useSelector(state => state.items[storeId].allItems );
  const totalPages = useMemo(() => Math.ceil( items.length / rowsPerPage ), [items]);
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    return items.slice((page - 1) * rowsPerPage, (page - 1) * rowsPerPage + rowsPerPage);
  }, [page, items]);

  return(
    <>
    <Box width="100%" height="320px" px={2} py={1} borderRadius={5} style={{ boxSizing: "border-box" }} display="flex" justifyContent="space-between" flexWrap="wrap" alignItems="flex-start" alignContent="flex-start">
      {
        rows.map(item => (
          <Item item={item} key={item._id} selectItem={selectItem} disabled={disabled} />
        ))
      }
    </Box>
    <Box textAlign="center" display="flex" justifyContent="center" alignItems="center" py={1} style={{ backgroundColor: "#fff" }} borderTop="1px solid #ececec">
      <Pagination count={totalPages} page={page}  onChange={(event, value) => setPage(value)} variant="outlined" color="primary" shape="round"/>
    </Box>
    </>
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

export default ItemsGrid;