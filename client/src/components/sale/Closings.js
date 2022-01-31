import React, { useMemo, useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faSync, faPrint } from '@fortawesome/free-solid-svg-icons';
import { Box, Button, TableContainer, Table, TableBody, TableCell, TableHead, TableRow, IconButton, TablePagination, Typography } from '@material-ui/core';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { loadClosings, emptyClosings } from '../../store/actions/closingActions';
import moment from 'moment';
import ClosingFilters from './ClosingFilters';
import { closingStates } from 'utils/constants';
import ReactGA from "react-ga4";

function Closings({ storeId, records, filters, totalRecords, recordsLoaded, loadingRecords, loadClosings, emptyClosings, printClosing, offlineSales }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const filterRef = useRef();
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/sale/closings", 'title' : "Closings" });
  }, []);

  useEffect(() => {
    if(filterRef.current !== filters && page !== 0)//filters changed, reset page to 0
      setPage(0);
    filterRef.current = filters;
    if(records.length === 0 && !loadingRecords && !recordsLoaded)// on Page load or filters changed or reset button
      loadClosings(rowsPerPage); 
  }, [filters, records.length, loadingRecords, recordsLoaded, loadClosings, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => { 
    setPage(newPage);
    let pageRecords = records.slice(newPage * rowsPerPage, newPage * rowsPerPage + rowsPerPage);
    if( pageRecords.length < rowsPerPage && records.length < totalRecords )//next page records are 0 or less than rows per page but server has more rows, 
      loadClosings(rowsPerPage);
   };

  const handleChangeRowsPerPage = (event) => {
    let newValue = +event.target.value;
    setRowsPerPage(+event.target.value);
    setPage(0);
    if( records.length < newValue && records.length < totalRecords ) //there are more rows on server and current rows are less then recordsPerPage
    {
      loadClosings(newValue);
    }
  };

  //get only page  rows, use Memo to prevent unneccary render of rows
  const rows = useMemo(() => {
    return records.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [page, rowsPerPage, records]);
  
  return(
    <>
      <ClosingFilters />
      {
        records.length === 0 && recordsLoaded && !loadingRecords ?
        <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
          <Typography gutterBottom>No closings found</Typography>
          <Button startIcon={ <FontAwesomeIcon icon={faSync} /> } variant="contained" onClick={() => emptyClosings(storeId)} color="primary" disableElevation  >Refresh</Button>
        </Box>
        :
        <Box>
          <TableContainer style={{ maxHeight: 'calc(100vh - 256px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center">Start Time</TableCell>
                  <TableCell align="center">End Time</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {
                  rows.map(closing => <Closing {...{closing, storeId, printClosing, offlineSales}} key={closing._id}  /> )
                }
              </TableBody>
            </Table>
          </TableContainer>
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
      }
      </>
  )
}


function Closing({ closing, storeId, printClosing, offlineSales }){
  return(
    <TableRow hover>
      <TableCell align="center">{ moment(closing.startTime).format("DD MMM, YYYY hh:mm A")  }</TableCell>
      <TableCell align="center">{ closing.endTime ? moment(closing.endTime).format("DD MMM, YYYY hh:mm A") : null }</TableCell>
      
      <TableCell align="right">
        {
          closing.status === closingStates.CLOSING_STATUS_CLOSED ? 
          <IconButton onClick={() => printClosing( closing ) } title="Print Closing">
            <FontAwesomeIcon icon={faPrint} size="xs" />
          </IconButton>
          : null
        }
        {
          closing.status === closingStates.CLOSING_STATUS_OPEN && offlineSales > 0 ? "Uploading sales...wait" : 
          <IconButton component={Link} to={ '/sale/closings/view/' + storeId + '/' + closing._id } title="View Closing">
            <FontAwesomeIcon icon={faEye} size="xs" />
          </IconButton>
        }
      </TableCell>
    </TableRow>
  )
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  let offlineSales = 0;
  if(storeId)
    offlineSales = state.sales[storeId] ? state.sales[storeId].offlineRecords.length : 0;
  const closings = state.closings[storeId] ? state.closings[storeId] : {
    records: [],
    totalRecords: 0,
    recordsLoaded: false,
    filters: {}
  }

  return {
    storeId,
    ...closings,
    loadingRecords: state.progressBar.loading,
    offlineSales
  }
}


export default connect(mapStateToProps, { loadClosings, emptyClosings })(Closings);