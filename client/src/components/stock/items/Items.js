import React, { useMemo } from 'react';
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Typography } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import { connect, useSelector } from 'react-redux';
import { loadItems, resetItems } from '../../../store/actions/itemActions';
import ItemFilters from './ItemFilters';
import { formValueSelector } from 'redux-form';

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

function Items({storeId, filters, filteredItems, filteredItemsCount, loadingItems, itemsLoaded, categoriesMap, loadItems, resetItems }) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const [moreFilters, setMoreFilters] = React.useState(false);
  const filterRef = React.useRef();

  React.useEffect(() => {
    if(filterRef.current !== filters && page !== 0)//filters changed, reset to page 0
      setPage(0);
    filterRef.current = filters;
    if(filteredItems.length === 0 && !loadingItems && !itemsLoaded)// on Page load or filters changed
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
    <ItemFilters {...{storeId, moreFilters, setMoreFilters, categoryId }} storeFilters={filters} />
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
              {rows.map((row) => {
                return (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row._id}>
                    <TableCell>{ row.itemCode }</TableCell>
                    <TableCell>{ row.itemName }</TableCell>
                    <TableCell>{ categoriesMap[row.categoryId] ? categoriesMap[row.categoryId] : "" }</TableCell>
                    <TableCell align="center">{ row.costPrice.toLocaleString('en-US') }</TableCell>
                    <TableCell align="center">{ row.salePrice.toLocaleString('en-US') }</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100, 250, 500]}
          component="div"
          count={filteredItemsCount}
          rowsPerPage={rowsPerPage}
          page={filteredItemsCount ? page : 0}
          onChangePage={handleChangePage}
          onChangeRowsPerPage={handleChangeRowsPerPage}
        />
      </Box>
      
    }
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

export default connect(mapStateToProps, { loadItems, resetItems })(Items);