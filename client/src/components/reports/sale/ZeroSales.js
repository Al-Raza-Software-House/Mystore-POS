import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faLayerGroup, faSync } from '@fortawesome/free-solid-svg-icons';
import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, TablePagination, Typography, makeStyles, IconButton, Popover } from '@material-ui/core';
import { connect, useSelector } from 'react-redux';
import moment from 'moment';
import axios from 'axios';
import { hideProgressBar, showProgressBar } from '../../../store/actions/progressActions';
import { showError } from '../../../store/actions/alertActions';
import ReactGA from "react-ga4";
import SaleReportsFilters from './SaleReportsFilters';
import { getFormValues, initialize } from 'redux-form';
import Pagination from '@material-ui/lab/Pagination';
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";
import clsx from "clsx";

const formName  = 'saleReportsFilters';
const dateFormat = "DD-MM-YYYY";

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
    id: 'batches',
    label: 'Batches',
    width: 65,
    align: 'center',
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

const itemKey = (index, data) => data.items[index]._id+index;

function ZeroSales({ storeId, allItems, loadingRecords, dispatch, categoriesMap }) {
  const filters = useSelector(state => getFormValues(formName)(state));
  const classes = useStyles();
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: `/reports/sale/zerosales`, 'title' : `Reports-Sale-Zero-Sales` });
  }, []);

  const items = useMemo(() => {
    let items = allItems;
    if(filters && filters.categoryId) 
      items = items.filter(item => item.categoryId === filters.categoryId);
    if(filters && filters.supplierId) 
      items = items.filter(item => item.supplierId === filters.supplierId);
    return items;
  }, [allItems, filters]);

  useEffect(() => {
    dispatch(initialize(formName, { zeroSaleInitialized: true, dateRange: moment().subtract(30, 'days').format("DD MMM, YYYY") + " - " + moment().format("DD MMM, YYYY"), categoryId: null, supplierId: null }))
  }, [dispatch])  

  const [records, setRecords] = useState([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const listRef = React.useRef();
  const [selectedItem, setSelectedItem] = useState(null); //item selected for delete
  const [batchesAnchorEl, setBatchesAnchorEl] = useState(null);

  const zeroSaleItems = useMemo(() => {
    if(!recordsLoaded) return [];
    if(records.length) 
      return items.filter(item => records.indexOf(item._id) === -1 );
    else if(recordsLoaded)
      return [];
  }, [items, records, recordsLoaded]);

  useEffect(() => {
    setPage(1);
    setRecords([]);
    setRecordsLoaded(false);
  }, [filters])

 const loadRecords = useCallback(() => {
   if(!filters || !filters.dateRange || !filters.zeroSaleInitialized) return;
    dispatch( showProgressBar() );
    axios.post('/api/reports/sale/zerosales', { storeId, ...filters } ).then( ({ data }) => {
      dispatch( hideProgressBar() );
      setRecords(data);
      setRecordsLoaded(true);
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch( showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }, [storeId, dispatch,  filters]);

  useEffect(() => {
    if(records.length === 0 && !recordsLoaded)
      loadRecords();
  }, [loadRecords, records.length, recordsLoaded]);
  

  const handleChangePage = (event, newPage) => { 
    setPage(newPage);
    listRef.current && listRef.current.scrollToItem(0);
   };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(1);
    listRef.current && listRef.current.scrollToItem(0);
  };

  const totalPages = useMemo(() => Math.ceil( zeroSaleItems.length / rowsPerPage ), [zeroSaleItems, rowsPerPage]);
  //get only page  rows, use Memo to prevent unneccary render of rows
  const rows = useMemo(() => {
    return zeroSaleItems.slice((page - 1) * rowsPerPage, (page - 1) * rowsPerPage + rowsPerPage);
  }, [page, rowsPerPage, zeroSaleItems]);

  const showBatches = useCallback((event, item) => {
    setSelectedItem(item);
    setBatchesAnchorEl(event.currentTarget);
  }, []);

  const itemData = useMemo(() => {
    return{
      items: rows,
      classes,
      categoriesMap,
      showBatches
    }
  }, [rows, classes, categoriesMap, showBatches]);

  return(
    <>
      <SaleReportsFilters />
      {
        zeroSaleItems.length === 0 && recordsLoaded && !loadingRecords ?
        <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
          <Typography gutterBottom>No records found</Typography>
          <Button startIcon={ <FontAwesomeIcon icon={faSync} /> } variant="contained" onClick={() => loadRecords()} color="primary" disableElevation  >Refresh</Button>
        </Box>
        :
        <Box width="100%">
          <Box style={{ height: 'calc(100vh - 262px)' }} className={classes.root}>
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
              count={zeroSaleItems.length}
              rowsPerPage={rowsPerPage}
              page={zeroSaleItems.length ? page - 1 : 0}
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
      <BatchesPopOver {...{batchesAnchorEl, setBatchesAnchorEl}} item={selectedItem}  />
      </>
  )
}


const Row = ({ index, style, data: { items, classes, categoriesMap, showBatches } }) => {
  const item = items[index];
  let currentStock = item.currentStock;
  let lowStock = item.currentStock < item.minStock;
  let overStock = item.currentStock > item.maxStock;
  return (
    <TableRow component="div" className={classes.row} style={style}>
      <TableCell component="div" variant="body" className={clsx( classes.cell  )} style={{ flexBasis: 110, height: ROW_HEIGHT }}>{ item.itemCode }</TableCell>
      <TableCell component="div" variant="body" className={clsx( classes.cell, classes.expandingCell  )} style={{ height: ROW_HEIGHT }}>
        <Box display="flex" justifyContent="space-between" width="100%">
          <span> {item.itemName} </span>
          {
            item.sizeName ?
            <span style={{ color: '#7c7c7c' }}> {item.sizeName} | {item.combinationName} </span>
            : null
          }
        </Box>
      </TableCell>
      <TableCell component="div" variant="body" className={clsx( classes.cell, )} style={{ flexBasis: 120, height: ROW_HEIGHT }}>{ categoriesMap[item.categoryId] ? categoriesMap[item.categoryId].name : "" }</TableCell>
      <TableCell component="div" variant="body" className={clsx( classes.cell  )} style={{ flexBasis: 65, height: ROW_HEIGHT, justifyContent: "center" }} align="center">{ item.costPrice.toLocaleString('en-US') }</TableCell>
      <TableCell component="div" variant="body" className={clsx( classes.cell  )} style={{ flexBasis: 65, height: ROW_HEIGHT, justifyContent: "center" }} align="center">{ item.salePrice.toLocaleString('en-US') }</TableCell>
      <TableCell component="div" variant="body" className={clsx( classes.cell  )} style={{ flexBasis: 65, height: ROW_HEIGHT, justifyContent: "center" }} align="center">
        { currentStock.toLocaleString() }
        { lowStock ? <FontAwesomeIcon title={`Low Stock, Min: ${item.minStock}`} color="#c70000" style={{ marginLeft: 4 }} icon={faExclamationTriangle} /> : null }
        { overStock ? <FontAwesomeIcon title={`Over Stock, Max: ${item.maxStock}`} color="#06ba3a" style={{ marginLeft: 4 }} icon={faExclamationTriangle} /> : null }
      </TableCell>
      <TableCell component="div" variant="body" className={clsx( classes.cell  )} style={{ flexBasis: 65, height: ROW_HEIGHT, justifyContent: "center" }} align="center">
        {
          item.batches && item.batches.length === 0 ? null : 
          <IconButton onClick={(event) => showBatches(event, item) } title="View Expiring Batches"> <FontAwesomeIcon icon={faLayerGroup} size="xs" /> </IconButton>
        }
      </TableCell>
    </TableRow>
  );
};


const BatchesPopOver = React.memo(
  function ({ batchesAnchorEl, setBatchesAnchorEl, item }){
    const handleClose = () => {
      setBatchesAnchorEl(null);
    };
    const open = Boolean(batchesAnchorEl);
    const id = open ? 'batches-popover' : undefined;
    if(!item) return null;
    return(
      <Popover 
        id={id}
        open={open}
        anchorEl={batchesAnchorEl}
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
                item.batches.map(batch => (
                  <TableRow key={batch._id}>
                    <TableCell><Typography style={{ color: '#6c6a6a', fontSize: 14 }}>{ batch.batchNumber }</Typography></TableCell>
                    <TableCell>
                      { moment(batch.batchExpiryDate).format(dateFormat) }
                    </TableCell>
                    <TableCell>
                      { batch.batchStock }
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
  const categories = state.categories[storeId] ? state.categories[storeId] : [];
  const categoriesMap = {};
  categories.forEach((record) => {
    categoriesMap[record._id] = record;
  })
  return {
    storeId,
    categoriesMap,
    allItems: state.items[storeId] ? state.items[storeId].allItems.filter(item => item.packParentId === null) : [],
    loadingRecords: state.progressBar.loading
  }
}


export default connect(mapStateToProps)(ZeroSales);