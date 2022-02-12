import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import { Box, Button, TableContainer, Table, TableBody, TableCell, TableHead, TableRow, TablePagination, Typography } from '@material-ui/core';
import { connect, useSelector } from 'react-redux';
import moment from 'moment';
import axios from 'axios';
import { hideProgressBar, showProgressBar } from '../../../store/actions/progressActions';
import { showError } from '../../../store/actions/alertActions';
import ReactGA from "react-ga4";
import SaleReportsFilters from './SaleReportsFilters';
import { getFormValues, initialize } from 'redux-form';
import { isManager } from 'utils';

const formName  = 'saleReportsFilters';

function ItemsStats({ storeId, allItems, type, loadingRecords, dispatch, userRole }) {
  const filters = useSelector(state => getFormValues(formName)(state));
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: `/reports/sale/${type}`, 'title' : `Reports-Sale-${type}` });
  }, [type]);

  const itemMaps = useMemo(() => {
    let maps = {};
      allItems.forEach(item => maps[item._id] = item);
    return maps;
  }, [allItems]);

  useEffect(() => {
    dispatch(initialize(formName, { formInitialized: true, dateRange: moment().subtract(30, 'days').format("DD MMM, YYYY") + " - " + moment().format("DD MMM, YYYY"), categoryId: null, supplierId: null }))
  }, [dispatch, type])  

  const [records, setRecords] = useState([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    setPage(0);
    setRecords([]);
    setRecordsLoaded(false);
  }, [filters])

 const loadRecords = useCallback(() => {
   if(!filters || !filters.dateRange || !filters.formInitialized) return;
    let skip = records.length;
    dispatch( showProgressBar() );
    axios.post('/api/reports/sale/items', { storeId, ...filters, skip, recordsPerPage: rowsPerPage, type } ).then( ({ data }) => {
      dispatch( hideProgressBar() );
      setRecords((preRecords) => ([...preRecords, ...data.records]));
      setTotalRecords(data.totalRecords);
      setRecordsLoaded(true);
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch( showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }, [storeId, dispatch, records.length, rowsPerPage, filters, type]);

  useEffect(() => {
    if(records.length === 0 && !recordsLoaded)
      loadRecords();
  }, [loadRecords, records.length, recordsLoaded]);
  

  const handleChangePage = (event, newPage) => { 
    setPage(newPage);
    let pageRecords = records.slice(newPage * rowsPerPage, newPage * rowsPerPage + rowsPerPage);
    if( pageRecords.length < rowsPerPage && records.length < totalRecords )//next page records are 0 or less than rows per page but server has more rows, 
      loadRecords();
   };

  const handleChangeRowsPerPage = (event) => {
    let newValue = +event.target.value;
    setRowsPerPage(+event.target.value);
    setPage(0);
    if( records.length < newValue && records.length < totalRecords ) //there are more rows on server and current rows are less then recordsPerPage
    {
      loadRecords();
    }
  };

  //get only page  rows, use Memo to prevent unneccary render of rows
  const rows = useMemo(() => {
    return records.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [page, rowsPerPage, records]);

  return(
    <>
      <SaleReportsFilters />
      {
        records.length === 0 && recordsLoaded && !loadingRecords ?
        <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
          <Typography gutterBottom>No records found</Typography>
          <Button startIcon={ <FontAwesomeIcon icon={faSync} /> } variant="contained" onClick={() => loadRecords()} color="primary" disableElevation  >Refresh</Button>
        </Box>
        :
        <Box>
          <TableContainer style={{ height: 'calc(100vh - '+ (270) +'px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="center" width="100px">Quantity</TableCell>
                  { isManager(userRole) ? null :  <TableCell align="center" width="100px">Sale Amount</TableCell> }
                  { isManager(userRole) ? null :  <TableCell align="center" width="100px">Gross Profit</TableCell> }
                  
                </TableRow>
              </TableHead>
              <TableBody>
                {
                  rows.map(record => 
                      <Record record={record} items={itemMaps}  key={record._id} type={type} userRole={userRole}  />
                    )
                }
              </TableBody>
            </Table>
          </TableContainer>
          <Box width="100%" display="flex" justifyContent="flex-end" alignItems="center">
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100, 250, 500]}
              component="div"
              count={totalRecords}
              rowsPerPage={rowsPerPage}
              page={totalRecords ? page : 0}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Box>
        </Box>
      }
      </>
  )
}


function Record({ record, items, type, userRole }){
  const item = useMemo(() => {
    return items[record._id];
  }, [items, record]);
  if(!item) return null;
  return(
    <TableRow hover>
      <TableCell align="center">
        <Box display="flex" justifyContent="space-between">
          <span> {item.itemName} </span>
          {
            item.sizeName ?
            <span style={{ color: '#7c7c7c' }}> {item.sizeName} | {item.combinationName} </span>
            : null
          }
        </Box>
      </TableCell>
      <TableCell align="center">
        {
          type === 'topSelling' || type === 'lowselling' ? 
          <b style={{ fontSize: 18, color: "#2196f3" }}>{ record.totalQuantity ? record.totalQuantity.toLocaleString() : record.totalQuantity }</b> :
          <span>{ record.totalQuantity ? record.totalQuantity.toLocaleString() : record.totalQuantity }</span>
        }
      </TableCell>
      { 
        isManager(userRole) ? null :  
        <>
          <TableCell align="center">{ record.totalSaleAmount ? Math.round(record.totalSaleAmount).toLocaleString() : record.totalSaleAmount }</TableCell>
          <TableCell align="center">
            {
              type === 'topprofitable' || type === 'lowprofitable' ? 
              <b style={{ fontSize: 18, color: "#2196f3" }}>{ record.totalProfit ? Math.round(record.totalProfit).toLocaleString() : record.totalProfit }</b> :
              <span>{ record.totalProfit ? Math.round(record.totalProfit).toLocaleString() : record.totalProfit }</span>
            }
          </TableCell>
        </> 
      }
    </TableRow>
  )
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  return {
    storeId,
    allItems: state.items[storeId] ? state.items[storeId].allItems.filter(item => item.packParentId === null) : [],
    loadingRecords: state.progressBar.loading,
    userRole: state.stores.userRole,
  }
}


export default connect(mapStateToProps)(ItemsStats);