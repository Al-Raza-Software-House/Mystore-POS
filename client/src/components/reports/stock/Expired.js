import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, makeStyles, TablePagination, Typography, Table, TableHead, TableBody, TableRow, TableCell, IconButton, Popover } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faLayerGroup, faUndo } from '@fortawesome/free-solid-svg-icons';
import { reduxForm, initialize, getFormValues, Field } from 'redux-form';
import { connect, useSelector } from 'react-redux';
import SelectCategory from 'components/stock/items/itemForm/SelectCategory';
import SelectSupplier from 'components/stock/items/itemForm/SelectSupplier';
import DateInput from 'components/library/form/DateInput';
import { compose } from 'redux';
import { categoryTypes } from 'utils/constants';
import moment from 'moment';
import ReactGA from "react-ga4";
import Pagination from '@material-ui/lab/Pagination';
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";
import clsx from "clsx";

const formName = 'stockExpiredFilters';
const dateFormat = "DD-MM-YYYY";

const ROW_HEIGHT = 43;

const columns = [
  { id: 'itemCode', label: 'Code', width: 110,  },
  { id: 'itemName', label: 'Name' },
  {
    id: 'supplierId',
    label: 'Supplier',
    align: 'left',
    width: 160,
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

const defaultFilters = {
  categoryId: null,
  supplierId: null
}

const areFiltersApplied = (filters) => {
  let filtersApplied = false;
  for(let key in filters)
  {
    if(!filters.hasOwnProperty(key)) continue;
    if(filters[key] !== defaultFilters[key])
    {
      filtersApplied = true;
    }
    if(filtersApplied) break;
  }
  return filtersApplied;
}
const itemKey = (index, data) => data.items[index]._id+index;
function Expired(props){
  const { dispatch, allItems, categoriesMap, suppliersMap } = props;
  const classes = useStyles();
  const formFilters = useSelector(state => getFormValues(formName)(state));
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const listRef = React.useRef();
  const [selectedItem, setSelectedItem] = useState(null); //item selected for delete
  const [batchesAnchorEl, setBatchesAnchorEl] = useState(null);

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/reports/stock/expired", 'title' : "Reports-Expired-Stock" });
  }, []);

  const parentItems = useMemo(() => allItems.filter(record => !record.isServiceItem && record.packParentId === null && categoriesMap[record.categoryId].type === categoryTypes.CATEGORY_TYPE_STANDARD), [allItems, categoriesMap]);

  useEffect(() => {
    setPage(1);
  }, [formFilters]);

  const filteredItems = useMemo(() => {
    if(!formFilters || !formFilters.expiryDate) return [];
    let items = parentItems;
    if(formFilters && formFilters.categoryId)
      items = items.filter(item => item.categoryId === formFilters.categoryId);
    if(formFilters && formFilters.supplierId)
      items = items.filter(item => item.supplierId === formFilters.supplierId);
    let expiryDate = typeof formFilters.expiryDate === 'object' ? formFilters.expiryDate : moment(formFilters.expiryDate, dateFormat);
    items = items.filter(item => item.batches.filter(batch => expiryDate.isSameOrAfter( moment(batch.batchExpiryDate), "day" ) ).length > 0);
    return items;
  }, [parentItems, formFilters])
  //for reset button
  let filtersApplied = useMemo(() => areFiltersApplied(formFilters), [formFilters]);

  const resetFilters = () => {
    dispatch( initialize(formName, defaultFilters) );
  }

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

  const showBatches = useCallback((event, item) => {
    setSelectedItem(item);
    setBatchesAnchorEl(event.currentTarget);
  }, []);

  const itemData = useMemo(() => {
    return{
      items: rows,
      classes,
      suppliersMap,
      showBatches
    }
  }, [rows, classes, suppliersMap, showBatches]);

  return(
    <>
    <Box width="100%" justifyContent="flex-end" alignItems="flex-start" display="flex" mb={0}>
      <Box flexGrow={1} display="flex" justifyContent="flex-start" alignItems="center" flexWrap="wrap">
        <Box width={{ xs: '100%', md: '25%' }} mx={2}>
          <SelectCategory formName={formName} addNewRecord={false} showError={false}/>
        </Box>
        <Box width={{ xs: '100%', md: '25%' }} mx={2}>
          <SelectSupplier formName={formName} addNewRecord={false} showError={false}/>
        </Box>
        <Box width={{ xs: '100%', md: '25%' }} mx={2}>
          <Field
            component={DateInput}
            openTo="year"
            views={["year", "month", "date"]}
            dateFormat={dateFormat}
            label="Expiring On"
            name="expiryDate"
            placeholder="Expiring on..."
            fullWidth={true}
            autoOk={true}
            inputVariant="outlined"
            margin="dense"
            type="text"
          />
        </Box>
        
        
        <Box minWidth="125px" alignSelf="flex-start" pt={1} display="flex" >
            {
              filtersApplied ? 
              <Button title="Reset Filters"  onClick={resetFilters} startIcon={ <FontAwesomeIcon icon={faUndo}  /> } variant="outlined" color="primary" disableElevation >Reset</Button>
              : null
            }
        </Box>
      </Box>
    </Box>
    {
      filteredItems.length ===0 ?
      <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
        {
          !formFilters || !formFilters.expiryDate ?
          <Typography gutterBottom>Please select a date to find expired items</Typography>
          :
          <Typography gutterBottom>No items are expiring on this date</Typography>
        }
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
    <BatchesPopOver {...{batchesAnchorEl, setBatchesAnchorEl}} item={selectedItem} expiryDate={formFilters && formFilters.expiryDate ? formFilters.expiryDate : null } />
    </>
  )
}

const Row = ({ index, style, data: { items, classes, suppliersMap, showBatches } }) => {
  const item = items[index];
  let currentStock = item.currentStock;
  let lowStock = item.currentStock < item.minStock;
  let overStock = item.currentStock > item.maxStock;
  return (
    <TableRow component="div" className={classes.row} style={style}>
      <TableCell component="div" variant="body" className={clsx( classes.cell  )} style={{ flexBasis: 110, height: ROW_HEIGHT }}>{ item.itemCode }</TableCell>
      <TableCell component="div" variant="body" className={clsx( classes.cell, classes.expandingCell  )} style={{ height: ROW_HEIGHT }}>{ item.itemName }</TableCell>
      <TableCell component="div" variant="body" className={clsx( classes.cell, )} style={{ flexBasis: 160, height: ROW_HEIGHT }}>{ item.supplierId && suppliersMap[item.supplierId] ? suppliersMap[item.supplierId].name : "" }</TableCell>
      <TableCell component="div" variant="body" className={clsx( classes.cell  )} style={{ flexBasis: 65, height: ROW_HEIGHT, justifyContent: "center" }} align="center">{ item.costPrice.toLocaleString('en-US') }</TableCell>
      <TableCell component="div" variant="body" className={clsx( classes.cell  )} style={{ flexBasis: 65, height: ROW_HEIGHT, justifyContent: "center" }} align="center">{ item.salePrice.toLocaleString('en-US') }</TableCell>
      <TableCell component="div" variant="body" className={clsx( classes.cell  )} style={{ flexBasis: 65, height: ROW_HEIGHT, justifyContent: "center" }} align="center">
        { currentStock.toLocaleString() }
        { lowStock ? <FontAwesomeIcon title={`Low Stock, Min: ${item.minStock}`} color="#c70000" style={{ marginLeft: 4 }} icon={faExclamationTriangle} /> : null }
        { overStock ? <FontAwesomeIcon title={`Over Stock, Max: ${item.maxStock}`} color="#06ba3a" style={{ marginLeft: 4 }} icon={faExclamationTriangle} /> : null }
      </TableCell>
      <TableCell component="div" variant="body" className={clsx( classes.cell  )} style={{ flexBasis: 65, height: ROW_HEIGHT, justifyContent: "center" }} align="center">
        <IconButton onClick={(event) => showBatches(event, item) } title="View Expiring Batches"> <FontAwesomeIcon icon={faLayerGroup} size="xs" /> </IconButton>
      </TableCell>
    </TableRow>
  );
};


const BatchesPopOver = React.memo(
  function ({ batchesAnchorEl, setBatchesAnchorEl, item, expiryDate }){
    const batches = useMemo(() => {
      if(!item) return [];
      if(!expiryDate) return [];
      let expiry = typeof expiryDate === 'object' ? expiryDate : moment(expiryDate, dateFormat);
      return item.batches.filter(batch => expiry.isSameOrAfter( moment(batch.batchExpiryDate), "day" ) );
    }, [item, expiryDate]);
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
                batches.map(batch => (
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
  const storeRecord = state.items[storeId] ? state.items[storeId] : { 
    allItems: [], //master data
    filters: {},
  };
  const categories = state.categories[storeId] ? state.categories[storeId] : [];
  const categoriesMap = {};
  categories.forEach((record) => {
    categoriesMap[record._id] = record;
  })

  const suppliers = state.suppliers[storeId] ? state.suppliers[storeId] : [];
  const suppliersMap = {};
  suppliers.forEach((record) => {
    suppliersMap[record._id] = record;
  })
  return{
    storeId,
    ...storeRecord,
    categoriesMap,
    suppliersMap
  }
}

export default compose(
  connect(mapStateToProps, null),
  reduxForm({ form: formName })
)(Expired);