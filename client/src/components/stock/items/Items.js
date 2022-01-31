import React, { useCallback, useMemo, useState } from 'react';
import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, TablePagination, Typography, Popover, IconButton, makeStyles } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsAltV, faCalendarAlt, faExclamationTriangle, faLayerGroup, faPencilAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import { connect, useSelector } from 'react-redux';
import { deleteItem } from '../../../store/actions/itemActions';
import ItemFilters from './ItemFilters';
import { formValueSelector } from 'redux-form';
import { Link, useParams } from 'react-router-dom';
import AdjustStock from './AdjustStock';
import AdjustBatchStock from './AdjustBatchStock';
import { matchSorter } from 'match-sorter';
import { useEffect } from 'react';
import Pagination from '@material-ui/lab/Pagination';
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";
import clsx from "clsx";
import { useRef } from 'react';
import { categoryTypes } from '../../../utils/constants';
import ReactGA from "react-ga4";

const formSelector = formValueSelector('itemListFilters');

const ROW_HEIGHT = 43;

const columns = [
  { id: 'itemCode', label: 'Code', width: 110,  },
  { id: 'itemName', label: 'Name' },
  {
    id: 'categoryId',
    label: 'Category',
    align: 'left',
    width: 120,
  },
  {
    id: 'costPrice',
    label: 'Cost',
    width: 65,
    align: 'center',
  },
  {
    id: 'salePrice',
    label: 'Retail',
    width: 65,
    align: 'center',
  },
  {
    id: 'currentStock',
    label: 'Stock',
    width: 65,
    align: 'center',
  },
  {
    id: 'actions',
    label: 'Actions',
    width: 170,
    align: 'right'
  }
];

const useStyles = makeStyles((theme) => ({
  root: {
    display: "block",
    flex: 1
  },
  table: {
    height: "100%",
    width: "100%"
  },
  list: {},
  thead: {},
  tbody: {
    width: "100%"
  },
  row: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    boxSizing: "border-box",
    minWidth: "100%",
    width: "100%"
  },
  headerRow: {},
  cell: {
    display: "inline-flex",
    alignItems: "center",
    overflow: "hidden",
    flexGrow: 0,
    flexShrink: 0
  },
  justifyCenter:{
    justifyContent: "center"
  },
  expandingCell: {
    flex: 1
  },
  column: {}
}));

const filtersHeight = 83;

const itemKey = (index, data) => data.items[index]._id+index;

function Items({storeId, filters, allItems, categoriesMap, deleteItem }) {
  const classes = useStyles();
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/stock", 'title' : "Items" });
  }, []);

  const { recordsPerPage, pageNumber } = useParams(); // while coming back from Edit item
  const [page, setPage] = useState(pageNumber? parseInt(pageNumber) :  1);
  const [rowsPerPage, setRowsPerPage] = useState(recordsPerPage ? parseInt(recordsPerPage) : 10);
  const [moreFilters, setMoreFilters] = useState(false);

  const [deleteAnchorEl, setDeleteAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null); //item selected for delete

  const [stockAnchorEl, setStockAnchorEl] = useState(null);

  const [adjustStockItemId, setAdjustStockItemId] = useState(null); //item selected for Adjust stock
  const [adjustBatchStockItem, setAdjustBatchStockItem] = useState(null); //item selected for Adjust stock
  const filterRef = React.useRef();
  const listRef = React.useRef();

  React.useEffect(() => {
      if(filterRef.current && filterRef.current !== filters && page !== 1)//filters changed, reset page to 0
        setPage(1);
      if(filterRef.current && filterRef.current !== filters)
        listRef.current && listRef.current.scrollToItem(0);
      filterRef.current = filters;
  }, [filters, page]);

  const parentItems = useMemo(() => {
    return allItems.filter(item => item.packParentId === null && item.varientParentId === null);
  }, [allItems]);


  const filteredItems = useMemo(() => {
    let items = parentItems;
    if(!filters) return items;
    if(filters.categoryId)
      items = items.filter(item => item.categoryId === filters.categoryId);
    if(filters.supplierId)
      items = items.filter(item => item.supplierId === filters.supplierId);
    if(parseInt(filters.itemType))
    {
      switch(parseInt(filters.itemType))
      {
        case 1: //find low stock item
          items = items.filter(item => {
            if(categoriesMap[item.categoryId].type === categoryTypes.CATEGORY_TYPE_STANDARD) return item.currentStock < item.minStock;
            return item.currentStock < item.minStock ||  allItems.filter(record => record.varientParentId === item._id && record.currentStock < record.minStock).length > 0;
          });
          break;
        case 2:
          items = items.filter(item => {
            if(categoriesMap[item.categoryId].type === categoryTypes.CATEGORY_TYPE_STANDARD) return item.currentStock > item.maxStock;
            return item.currentStock > item.maxStock ||  allItems.filter(record => record.varientParentId === item._id && record.currentStock > record.maxStock).length > 0;
          });
          break;
        case 3:
          items = items.filter(item => {
            if(categoriesMap[item.categoryId].type === categoryTypes.CATEGORY_TYPE_STANDARD) return item.currentStock === 0;
            return item.currentStock === 0 ||  allItems.filter(record => record.varientParentId === item._id && record.currentStock === 0 ).length > 0;
          });;
          break;
        case 4:
          items = items.filter(item => item.isServiceItem );
          break;
        case 5:
          items = items.filter(item => item.isActive );          
          break;
        case 6:
          items = items.filter(item => !item.isActive );   
          break;
        default:
          break;
      }
    }
    if(filters.itemCodeName)
    {
      items = matchSorter(items, filters.itemCodeName, { keys: ["itemNameLC", 'itemCodeLC'] })
    }
    if(filters.itemPropertyValues)
    {
      if(filters.itemPropertyValues.property1) items = items.filter(item => item.itemPropertyValues.property1 === filters.itemPropertyValues.property1);
      if(filters.itemPropertyValues.property2) items = items.filter(item => item.itemPropertyValues.property2 === filters.itemPropertyValues.property2);
      if(filters.itemPropertyValues.property3) items = items.filter(item => item.itemPropertyValues.property3 === filters.itemPropertyValues.property3);
      if(filters.itemPropertyValues.property4) items = items.filter(item => item.itemPropertyValues.property4 === filters.itemPropertyValues.property4);
    }
    if(filters.categoryId && filters.categoryPropertyValues)
    {
      if(filters.categoryPropertyValues.property1) items = items.filter(item => item.categoryPropertyValues.property1 === filters.categoryPropertyValues.property1);
      if(filters.categoryPropertyValues.property2) items = items.filter(item => item.categoryPropertyValues.property2 === filters.categoryPropertyValues.property2);
      if(filters.categoryPropertyValues.property3) items = items.filter(item => item.categoryPropertyValues.property3 === filters.categoryPropertyValues.property3);
      if(filters.categoryPropertyValues.property4) items = items.filter(item => item.categoryPropertyValues.property4 === filters.categoryPropertyValues.property4);
    }
    return items;
  }, [parentItems, allItems, filters, categoriesMap])

  const promptDelete = useCallback((event, item) => {
    setSelectedItem(item);
    setDeleteAnchorEl(event.currentTarget);
  }, []);

  const showVariantStock = useCallback((event, item) => {
    setSelectedItem(item);
    setStockAnchorEl(event.currentTarget);
  }, []);

  const deleteRecord = useCallback(() => {
    deleteItem(storeId, selectedItem._id);
    setDeleteAnchorEl(null);
  }, [deleteItem, storeId, selectedItem]);

  //adjust the height of Table if filters are expanded/collapsed
  const categoryId = useSelector(state => formSelector(state, 'categoryId'));
  const moreFiltersHeight = useMemo(() => {
    let height = moreFilters ? filtersHeight : 0;
    if(moreFilters && categoryId)
      height += 85;
    return height;
  }, [moreFilters, categoryId])

  const handleChangePage = (event, newPage) => { 
    setPage(newPage);
    listRef.current && listRef.current.scrollToItem(0);
   };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(1);
    listRef.current && listRef.current.scrollToItem(0);
  };

  const totalPages = useMemo(() => Math.ceil( filteredItems.length / rowsPerPage ), [filteredItems, rowsPerPage]);
  //get only page  rows, use Memo to prevent unneccary render of rows
  const rows = useMemo(() => {
    return filteredItems.slice((page - 1) * rowsPerPage, (page - 1) * rowsPerPage + rowsPerPage);
  }, [page, rowsPerPage, filteredItems]);

  const itemData = useMemo(() => {
    return{
      items: rows,
      classes,
      categoriesMap,
      promptDelete,
      showVariantStock,
      setAdjustStockItemId,
      setAdjustBatchStockItem,
      rowsPerPage,
      page
    }
  }, [rows, classes, categoriesMap, promptDelete, rowsPerPage, page, showVariantStock]);

  const [showFilters, setShowFilters] = useState(false);
  const renderTimer = useRef();
  useEffect(() => {
    renderTimer.current = setTimeout(() => setShowFilters(true), 5);
    return () => renderTimer.current && clearTimeout(renderTimer.current);
  }, [])

  return(
    <Box mt={-2}>
    { !showFilters ? <Box height="52px"></Box> : <ItemFilters {...{storeId, moreFilters, setMoreFilters, categoryId }} initialValues={filters} />  }
    {
      filteredItems.length ===0 ?
      <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
        <Typography gutterBottom>No items found</Typography>
        <Typography gutterBottom>Reset filters to load all items</Typography>
      </Box>
      :
      <Box width="100%">
        <Box style={{ height: 'calc(100vh - '+ (211 + moreFiltersHeight ) +'px)' }} className={classes.root}>
          <Table className={classes.table} component="div">
            <TableHead component="div" className={classes.thead}>
              <TableRow component="div" className={clsx(classes.row, classes.headerRow)}>
                {
                  columns.map((column) => (
                  <TableCell
                    component="div"
                    variant="head"
                    key={column.id}
                    align={column.align}
                    className={clsx(
                      classes.cell,
                      classes.column,
                      column.align === 'center' && classes.justifyCenter,
                      !column.width && classes.expandingCell
                    )}
                    style={{
                      flexBasis: column.width || false,
                      height: ROW_HEIGHT
                    }}
                    scope="col"
                  >
                    {column.label}
                  </TableCell>
                ))
                }
              </TableRow>
            </TableHead>
            <TableBody component="div" className={classes.tbody}>
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    className={classes.list}
                    height={height}
                    width={width}
                    itemCount={rows.length}
                    itemSize={ROW_HEIGHT}
                    itemKey={itemKey}
                    itemData={itemData}
                    ref={listRef}
                  >
                    {Row}
                  </List>
                )}
              </AutoSizer>
            </TableBody>
          </Table>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100, 250, 500]}
            component="div"
            count={filteredItems.length}
            rowsPerPage={rowsPerPage}
            page={filteredItems.length ? page - 1 : 0}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            backIconButtonProps={{
              style: { display: "none" }
            }}
            nextIconButtonProps={{
              style: { display: "none" }
            }}
            
            style={{ height: "45px", overflow: "hidden" }}
          />
          <Box>
            <Pagination count={totalPages} page={page}  onChange={handleChangePage} variant="outlined" color="primary" shape="round"/>
          </Box>
        </Box>
      </Box>
      
    }
    <DeletePopOver {...{deleteRecord, deleteAnchorEl, setDeleteAnchorEl }} item={selectedItem} />
    <StockPopOver {...{stockAnchorEl, setStockAnchorEl, allItems}} item={selectedItem} />
    <AdjustStock storeId={storeId} itemId={adjustStockItemId} setItemId={setAdjustStockItemId} />
    <AdjustBatchStock storeId={storeId} item={adjustBatchStockItem} setItem={setAdjustBatchStockItem} />
    </Box>
  )
}


const Row = ({ index, style, data: { items, classes, categoriesMap, promptDelete, showVariantStock, setAdjustStockItemId, setAdjustBatchStockItem, rowsPerPage,page } }) => {
  const item = items[index];
  let currentStock = item.currentStock;
  let lowStock = item.currentStock < item.minStock;
  let overStock = item.currentStock > item.maxStock;
  return (
    <TableRow component="div" className={classes.row} style={style}>
      <TableCell component="div" variant="body" className={clsx( classes.cell  )} style={{ flexBasis: 110, height: ROW_HEIGHT }}>{ item.itemCode }</TableCell>
      <TableCell component="div" variant="body" className={clsx( classes.cell, classes.expandingCell  )} style={{ height: ROW_HEIGHT }}>{ item.itemName }</TableCell>
      <TableCell component="div" variant="body" className={clsx( classes.cell, )} style={{ flexBasis: 120, height: ROW_HEIGHT }}>{ categoriesMap[item.categoryId] ? categoriesMap[item.categoryId].name : "" }</TableCell>
      <TableCell component="div" variant="body" className={clsx( classes.cell  )} style={{ flexBasis: 65, height: ROW_HEIGHT, justifyContent: "center" }} align="center">{ item.costPrice.toLocaleString('en-US') }</TableCell>
      <TableCell component="div" variant="body" className={clsx( classes.cell  )} style={{ flexBasis: 65, height: ROW_HEIGHT, justifyContent: "center" }} align="center">{ item.salePrice.toLocaleString('en-US') }</TableCell>
      <TableCell component="div" variant="body" className={clsx( classes.cell  )} style={{ flexBasis: 65, height: ROW_HEIGHT, justifyContent: "center" }} align="center">
        {
          item.sizeId ? 
          <IconButton onClick={(event) => showVariantStock(event, item) } title="View Stock of All variants"> <FontAwesomeIcon icon={faLayerGroup} size="xs" /> </IconButton>
          :
          <>
            { currentStock.toLocaleString() }
            { lowStock ? <FontAwesomeIcon title="Low Stock" color="#c70000" style={{ marginLeft: 4 }} icon={faExclamationTriangle} /> : null }
            { overStock ? <FontAwesomeIcon title="Over Stock" color="#06ba3a" style={{ marginLeft: 4 }} icon={faExclamationTriangle} /> : null }
          </>
        }
      </TableCell>
      <TableCell component="div" variant="body" className={clsx( classes.cell  )} style={{ flexBasis: 170, height: ROW_HEIGHT, display: "block"}} align="right">
        { 
          item.isServiceItem ? null : 
          <IconButton onClick={(event) => setAdjustStockItemId(item._id) } title="Adjust Stock">
            <FontAwesomeIcon icon={faArrowsAltV} size="xs" />
          </IconButton>
        }
        { item.isServiceItem || item.sizeId ? null : 

          <IconButton onClick={(event) => setAdjustBatchStockItem(item) } title="Adjust Batch Stock">
            <FontAwesomeIcon icon={faCalendarAlt} size="xs" />
          </IconButton>
        }
        <IconButton component={Link} to={ '/stock/items/edit/' + item.storeId + '/' + item._id + '/' + rowsPerPage + '/' + page }  title="Edit Item">
          <FontAwesomeIcon icon={faPencilAlt} size="xs" />
        </IconButton>
        <IconButton onClick={(event) => promptDelete(event, item) } title="Delete Item">
          <FontAwesomeIcon icon={faTrash} size="xs" />
        </IconButton>

      </TableCell>
    </TableRow>
  );
};

const DeletePopOver = React.memo(
  function ({ deleteAnchorEl, setDeleteAnchorEl, item, deleteRecord }){    
    const handleClose = () => {
      setDeleteAnchorEl(null);
    };
    const open = Boolean(deleteAnchorEl);
    const id = open ? 'simple-popover' : undefined;
    if(!item) return null;
    return(
      <Popover 
        id={id}
        open={open}
        anchorEl={deleteAnchorEl}
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
          <Button disableElevation variant="contained" color="primary"  onClick={deleteRecord}>
            Delete Item
          </Button>
        </Box>
      </Popover>
    )
  }
)

const StockPopOver = React.memo(
  function ({ stockAnchorEl, setStockAnchorEl, item, allItems }){
    const variants = useMemo(() => {
      if(!item) return [];
      let variants = allItems.filter(record => record.varientParentId === item._id);
      let rows = [item, ...variants];
      rows = rows.map(row => ({
        ...row,
        lowStock: row.currentStock < row.minStock,
        overStock: row.currentStock > row.maxStock
      }))
      return rows;
    }, [item, allItems]);
    const handleClose = () => {
      setStockAnchorEl(null);
    };
    const open = Boolean(stockAnchorEl);
    const id = open ? 'stock-popover' : undefined;
    if(!item) return null;
    return(
      <Popover 
        id={id}
        open={open}
        anchorEl={stockAnchorEl}
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
          <Typography gutterBottom align="center"><b>{item.itemName}</b></Typography>
          <Table>
            <TableBody>
              {
                variants.map(record => (
                  <TableRow key={record._id}>
                    <TableCell><Typography style={{ color: '#6c6a6a', fontSize: 14 }}>{record.sizeName} { record.sizeName && record.combinationName ? "|" : ""  } {record.combinationName}</Typography></TableCell>
                    <TableCell>
                      { record.currentStock.toLocaleString() }
                      { record.lowStock ? <FontAwesomeIcon title="Low Stock" color="#c70000" style={{ marginLeft: 4 }} icon={faExclamationTriangle} /> : null }
                      { record.overStock ? <FontAwesomeIcon title="Over Stock" color="#06ba3a" style={{ marginLeft: 4 }} icon={faExclamationTriangle} /> : null }
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </Box>
      </Popover>
    )
  }
)

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  const storeRecord = state.items[storeId] ? state.items[storeId] : { 
    allItems: [], //master data
    filters: {},
  };
  const categories = state.categories[storeId] ? state.categories[storeId] : [];
  const categoriesMap = {};
  categories.forEach((record) => {
    categoriesMap[record._id] = record;
  })
  return{
    storeId,
    ...storeRecord,
    categoriesMap,
  }
}

export default connect(mapStateToProps, { deleteItem })(Items);