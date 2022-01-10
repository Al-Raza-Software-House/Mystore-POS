import React, { useEffect, useMemo, useState } from 'react'
import { Box, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, TablePagination, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import clsx from 'clsx';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import ItemImage from './ItemImage';
import { isSalesperson } from 'utils';

function ItemPickerTable(props){
  const { items, selectItem, removeItem, selectedItems } = props;
  const userRole = useSelector(state => state.stores.userRole);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setPage(oldPage => oldPage > 0 ? 0 : oldPage);
  }, [items])

  const handleChangePage = (event, newPage) => { 
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const rows = useMemo(() => {
    return items.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [page, rowsPerPage, items]);

  return(
    <>
    {
      items.length > 0 ?
      <Box width="100%" maxHeight="100%">
        <TableContainer >
          <Table stickyHeader aria-label="sticky table" size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item Code</TableCell>
                <TableCell>Item Name</TableCell>
                <TableCell align="center">Current Stock</TableCell>
                { isSalesperson(userRole) ? null : <TableCell align="center">Cost Price</TableCell> }
                <TableCell align="center">Sale Price</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {
                rows.map( (row) => (<Item key={row._id} item={row}  selectItem={selectItem} userRole={userRole} removeItem={removeItem} selectedItems={selectedItems} />) )
              }
            </TableBody>
          </Table>
        </TableContainer>
        <Box width="100%" justifyContent="space-between" display="flex" alignItems="center">
          <Typography variant="body1"> Total Selected: <b>{ selectedItems.length } </b></Typography>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100, 250, 500]}
            component="div"
            count={items.length}
            rowsPerPage={rowsPerPage}
            page={items.length && items.length < (page+1)*rowsPerPage ? page : 0}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      </Box>
      :
      <Box width="100%">
        <Typography align="center" style={{ color: '#6c6a6a' }} >No items found</Typography>
      </Box>
    }
    </>
  )
}

const useStyles = makeStyles(them => ({
  selectedItem: {
    backgroundColor: "#d1d1d1",
    '&:hover':{
       backgroundColor: "#d1d1d1 !important",
    }
  }
}));

function Item({ item, selectItem, removeItem, selectedItems, userRole }){
  const classes = useStyles();
  const storeId = useSelector(state => state.stores.selectedStoreId);
  let allItems = useSelector(state => state.items[storeId].allItems );
  let currentStock = item.currentStock;
  let lowStock = item.currentStock < item.minStock;
  let overStock = item.currentStock > item.maxStock
  if(item.packParentId)
  {
    let parentItem = allItems.find(record => record._id === item.packParentId);
    if(parentItem)
    {
      currentStock = parentItem.currentStock; 
      lowStock = parentItem.currentStock < parentItem.minStock;
      overStock = parentItem.currentStock > parentItem.maxStock
    }
  }
  const isSelected = useMemo(() => {
    return selectedItems.find(record => record._id === item._id) ? true : false;
  }, [selectedItems, item]);
  return(
    <>
    <TableRow hover role="checkbox" tabIndex={-1} onClick={() => isSelected ? removeItem(item) : selectItem(item)} className={ clsx({
      [classes.selectedItem] : isSelected
      }) }>
      <TableCell>
        <Typography style={{ fontSize: 14 }}>{item.itemCode}{item.sizeCode ? '-' : ""}{item.sizeCode}{item.combinationCode ? '-' : ""}{item.combinationCode}</Typography>
      </TableCell>
      <TableCell>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography>{item.itemName}</Typography>
          <Typography style={{ color: '#6c6a6a', fontSize: 14 }}>
            {item.sizeName} { item.sizeName && item.combinationName ? "|" : ""  } {item.combinationName}
            <ItemImage item={item} />
          </Typography>
        </Box>
      </TableCell>
      <TableCell align="center">
        { currentStock.toLocaleString() }
        { lowStock ? <FontAwesomeIcon title="Low Stock" color="#c70000" style={{ marginLeft: 4 }} icon={faExclamationTriangle} /> : null }
        { overStock ? <FontAwesomeIcon title="Over Stock" color="#06ba3a" style={{ marginLeft: 4 }} icon={faExclamationTriangle} /> : null }
        { item.packParentId ? <Box style={{ color: '#7c7c7c' }}>units</Box> : null }
      </TableCell>
      {
        isSalesperson(userRole) ? null :
        <TableCell align="center">{ item.packParentId ?  +(item.packQuantity * item.costPrice).toFixed(2).toLocaleString() :  item.costPrice.toLocaleString('en-US') }</TableCell>
      }
      <TableCell align="center">{ item.packParentId ? item.packSalePrice.toLocaleString() : item.salePrice.toLocaleString('en-US') }</TableCell>
    </TableRow>
  </>
  )
}

export default ItemPickerTable;