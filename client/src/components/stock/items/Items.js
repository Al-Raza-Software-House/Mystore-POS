import React, { useMemo, useState } from 'react';
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Typography, Popover, IconButton } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faPencilAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import { connect, useSelector } from 'react-redux';
import { loadItems, resetItems, deleteItem } from '../../../store/actions/itemActions';
import ItemFilters from './ItemFilters';
import { formValueSelector } from 'redux-form';
import { Link, useParams } from 'react-router-dom';
import AdjustStock from './AdjustStock';
import AdjustBatchStock from './AdjustBatchStock';

const formSelector = formValueSelector('itemListFilters');

const columns = [
  { id: 'itemCode', label: 'Code', minWidth: 110,  },
  { id: 'itemName', label: 'Name', minWidth: 200 },
  {
    id: 'categoryId',
    label: 'Category',
    minWidth: 100,
    align: 'left'
  },
  {
    id: 'costPrice',
    label: 'Cost Price',
    minWidth: 70,
    align: 'center',
  },
  {
    id: 'salePrice',
    label: 'Sale Price',
    minWidth: 70,
    align: 'center',
  },
  {
    id: 'actions',
    label: 'Actions',
    minWidth: 170,
    align: 'right'
  }
];

const filtersHeight = 172;

function Items({storeId, filters, filteredItems, filteredItemsCount, loadingItems, itemsLoaded, categoriesMap, loadItems, resetItems, deleteItem }) {
  const { recordsPerPage, pageNumber } = useParams();
  const [page, setPage] = React.useState(pageNumber? parseInt(pageNumber) :  0);
  const [rowsPerPage, setRowsPerPage] = React.useState(recordsPerPage ? parseInt(recordsPerPage) : 25);
  const [moreFilters, setMoreFilters] = React.useState(false);
  const filterRef = React.useRef();

  React.useEffect(() => {
    if(filterRef.current && filterRef.current !== filters && page !== 0)//filters changed, reset page to 0
      setPage(0);
    filterRef.current = filters;
    if(filteredItems.length === 0 && !loadingItems && !itemsLoaded)// on Page load or filters changed or reset button
      loadItems(rowsPerPage); 
}, [filters, filteredItems.length, loadingItems, itemsLoaded, loadItems, page, rowsPerPage]);

  //adjust the height of Table if filters are expanded/collapsed
  const categoryId = useSelector(state => formSelector(state, 'categoryId'));
  let moreFiltersHeight = moreFilters ? filtersHeight : 0;
  if(moreFilters && categoryId)
    moreFiltersHeight += 98;

  const handleChangePage = (event, newPage) => { 
    setPage(newPage);
    let records = filteredItems.slice(newPage * rowsPerPage, newPage * rowsPerPage + rowsPerPage);
    if( records.length < rowsPerPage && filteredItems.length < filteredItemsCount )//next page records are 0 or less than rows per page but server has more rows, 
      loadItems(rowsPerPage);
   };

  const handleChangeRowsPerPage = (event) => {
    let newValue = +event.target.value;
    setRowsPerPage(+event.target.value);
    setPage(0);
    if( filteredItems.length < newValue && filteredItems.length < filteredItemsCount ) //there are more rows on server and current rows are less then recordsPerPage
    {
      loadItems(newValue);
    }
  };

  //get only page  rows, use Memo to prevent unneccary render of rows
  const rows = useMemo(() => {
    return filteredItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [page, rowsPerPage, filteredItems]);

  

  return(
    <>
    <ItemFilters {...{storeId, moreFilters, setMoreFilters, categoryId, recordsPerPage }} storeFilters={filters} />
    {
      filteredItems.length ===0 && itemsLoaded && !loadingItems ?
      <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
        <Typography gutterBottom>No items found</Typography>
        <Button startIcon={ <FontAwesomeIcon icon={faSync} /> } variant="contained" onClick={() => resetItems(storeId)} color="primary" disableElevation  >Refresh</Button>
      </Box>
      :
      <Box width="100%">
        <TableContainer style={{ maxHeight: 'calc(100vh - '+ (256 + moreFiltersHeight ) +'px)' }}>
          <Table stickyHeader aria-label="sticky table" size="small">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    style={{ minWidth: column.minWidth }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map( (row) => (<Item key={row._id} item={row} categoriesMap={categoriesMap} storeId={storeId} deleteItem={deleteItem} rowsPerPage={rowsPerPage} page={page} />) )
              }
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100, 250, 500]}
          component="div"
          count={filteredItemsCount}
          rowsPerPage={rowsPerPage}
          page={filteredItemsCount ? page : 0}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
      
    }
    </>
  )
}


function Item({ item, categoriesMap, storeId, deleteItem, rowsPerPage, page }){
  const [anchorEl, setAnchorEl] = useState(null);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;
  return(
    <>
    <TableRow hover role="checkbox" tabIndex={-1} >
      <TableCell>{ item.itemCode }</TableCell>
      <TableCell>{ item.itemName }</TableCell>
      <TableCell>{ categoriesMap[item.categoryId] ? categoriesMap[item.categoryId] : "" }</TableCell>
      <TableCell align="center">{ item.costPrice.toLocaleString('en-US') }</TableCell>
      <TableCell align="center">{ item.salePrice.toLocaleString('en-US') }</TableCell>
      <TableCell align="right">
        
        
        { item.isServiceItem ? null : <AdjustStock storeId={storeId} itemId={item._id} /> }
        { item.isServiceItem || item.sizeId ? null : <AdjustBatchStock storeId={storeId} itemId={item._id} /> }
        <IconButton component={Link} to={ '/stock/items/edit/' + storeId + '/' + item._id + '/' + rowsPerPage + '/' + page }  title="Edit Item">
          <FontAwesomeIcon icon={faPencilAlt} size="xs" />
        </IconButton>
        <IconButton onClick={(event) => handleClick(event) } title="Delete Item">
          <FontAwesomeIcon icon={faTrash} size="xs" />
        </IconButton>

      </TableCell>
    </TableRow>
    <Popover 
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        >
        <Box py={2} px={4} textAlign="center">
          <Typography gutterBottom>All variants/packings(if any) of this item will also be deleted.</Typography>
          <Typography gutterBottom>Do you want to delete <b>{item.itemName}</b> item from store?</Typography>
          <Button disableElevation variant="contained" color="primary"  onClick={() => deleteItem(storeId, item._id)}>
            Delete Item
          </Button>
        </Box>
      </Popover>
  </>
  )
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  const storeRecord = state.items[storeId] ? state.items[storeId] : { 
    allItems: [], //master data
    filters: {},
    filteredItems: [],
    filteredItemsCount: 0,
    itemsLoaded: false
  };
  const categories = state.categories[storeId] ? state.categories[storeId] : [];
  const categoriesMap = {};
  categories.forEach((record) => {
    categoriesMap[record._id] = record.name
  })
  return{
    storeId,
    filters: storeRecord.filters,
    filteredItems: storeRecord.filteredItems,
    filteredItemsCount: storeRecord.filteredItemsCount,
    itemsLoaded: storeRecord.itemsLoaded,
    categoriesMap,
    loadingItems: state.progressBar.loading
  }
}

export default connect(mapStateToProps, { loadItems, resetItems, deleteItem })(Items);