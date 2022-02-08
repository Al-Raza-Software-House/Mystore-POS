import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import { Box, Button, TableContainer, Table, TableBody, TableCell, TableHead, TableRow, TablePagination, Typography } from '@material-ui/core';
import { connect } from 'react-redux';
import moment from 'moment';
import DateRangeFilter from '../../library/form/DateRangeFilter';
import axios from 'axios';
import { hideProgressBar, showProgressBar } from '../../../store/actions/progressActions';
import { showError } from '../../../store/actions/alertActions';
import ReactGA from "react-ga4";

function Adjustments({ storeId, reasons, allItems, loadingRecords, dispatch }) {
  const [dateRange, setDateRange] = useState(() => {
    return moment().subtract(30, 'days').format("DD MMM, YYYY") + " - " + moment().format("DD MMM, YYYY")
  });

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/reports/stock/adjustments", 'title' : "Reports-Stock-Adjustment" });
  }, []);

  const [records, setRecords] = useState([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    setPage(0);
    setRecords([]);
    setRecordsLoaded(false);
  }, [dateRange])

 const loadRecords = useCallback(() => {
    let skip = records.length;
    dispatch( showProgressBar() );
    axios.post('/api/reports/stock/adjustments', { storeId, dateRange, skip, recordsPerPage: rowsPerPage} ).then( ({ data }) => {
      dispatch( hideProgressBar() );
      setRecords((preRecords) => ([...preRecords, ...data.records]));
      setTotalRecords(data.totalRecords);
      setRecordsLoaded(true);
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch( showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }, [storeId, dispatch, records.length, rowsPerPage, dateRange]);

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
      <Box display="flex" justifyContent="flex-start" alignItems="center" >
        <Box width={{ xs: '100%', md: '40%' }}>
            <DateRangeFilter
              variant="outlined"
              placeholder="Select date range..."
              margin="dense"
              fullWidth={true}
              value={dateRange}
              onChange={setDateRange}

          />
        </Box>
      </Box>
      {
        records.length === 0 && recordsLoaded && !loadingRecords ?
        <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
          <Typography gutterBottom>No stock adjustments found in this period</Typography>
          <Button startIcon={ <FontAwesomeIcon icon={faSync} /> } variant="contained" onClick={() => loadRecords()} color="primary" disableElevation  >Refresh</Button>
        </Box>
        :
        <Box>
          <TableContainer style={{ height: 'calc(100vh - '+ (270) +'px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell width="120px">Time</TableCell>
                  <TableCell>Item</TableCell>
                  <TableCell align="center">Quantity</TableCell>
                  <TableCell align="center">Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {
                  rows.map(record => 
                      <Record {...{record, reasons, allItems, storeId}}  key={record._id}  />
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


function Record({ record, storeId, reasons, allItems }){
  const item = useMemo(() => {
    return allItems.find(elem => elem._id === record.itemId);
  }, [allItems, record]);
  if(!item) return null;
  return(
    <TableRow hover>
      <TableCell>{ moment(record.time).format("DD MMM, hh:mm A")  }</TableCell>
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
      <TableCell align="center">{ record.quantity }</TableCell>
      <TableCell align="center">{ reasons[record.reasonId] ? reasons[record.reasonId].name : "" }</TableCell>
    </TableRow>
  )
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  const reasons = state.adjustmentReasons[storeId] ? state.adjustmentReasons[storeId] : [];
  const reasonsMap = {};
  for(let i=0; i<reasons.length; i++)
  {
    reasonsMap[ reasons[i]._id ] = reasons[i];
  }

  return {
    storeId,
    reasons: reasonsMap,
    allItems: state.items[storeId] ? state.items[storeId].allItems : [],
    loadingRecords: state.progressBar.loading
  }
}


export default connect(mapStateToProps)(Adjustments);