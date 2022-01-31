import React, { useMemo, useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faTrash, faSync, faPrint } from '@fortawesome/free-solid-svg-icons';
import { Box, Button, TableContainer, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Popover, TablePagination, Typography } from '@material-ui/core';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { loadRtvs, emptyRtvs, deleteRtv } from '../../../store/actions/rtvActions';
import moment from 'moment';
import RtvFilters from './RtvFilters';
import ReactGA from "react-ga4";

function Rtvs({ storeId, suppliers, lastEndOfDay, records, filters, totalRecords, recordsLoaded, loadingRecords, loadRtvs, emptyRtvs, deleteRtv, printRtv }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const filterRef = useRef();
  
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/purchase/rtvs", 'title' : "RTVs" });
  }, []);

  useEffect(() => {
    if(filterRef.current !== filters && page !== 0)//filters changed, reset page to 0
      setPage(0);
    filterRef.current = filters;
    if(records.length === 0 && !loadingRecords && !recordsLoaded)// on Page load or filters changed or reset button
      loadRtvs(rowsPerPage); 
  }, [filters, records.length, loadingRecords, recordsLoaded, loadRtvs, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => { 
    setPage(newPage);
    let pageRecords = records.slice(newPage * rowsPerPage, newPage * rowsPerPage + rowsPerPage);
    if( pageRecords.length < rowsPerPage && records.length < totalRecords )//next page records are 0 or less than rows per page but server has more rows, 
      loadRtvs(rowsPerPage);
   };

  const handleChangeRowsPerPage = (event) => {
    let newValue = +event.target.value;
    setRowsPerPage(+event.target.value);
    setPage(0);
    if( records.length < newValue && records.length < totalRecords ) //there are more rows on server and current rows are less then recordsPerPage
    {
      loadRtvs(newValue);
    }
  };

  //get only page  rows, use Memo to prevent unneccary render of rows
  const rows = useMemo(() => {
    return records.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [page, rowsPerPage, records]);
  
  return(
    <>
      <RtvFilters />
      {
        records.length === 0 && recordsLoaded && !loadingRecords ?
        <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
          <Typography gutterBottom>No RTV found</Typography>
          <Button startIcon={ <FontAwesomeIcon icon={faSync} /> } variant="contained" onClick={() => emptyRtvs(storeId)} color="primary" disableElevation  >Refresh</Button>
        </Box>
        :
        <Box>
          <TableContainer style={{ maxHeight: 'calc(100vh - 256px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center">RTV No.</TableCell>
                  <TableCell align="center">Date</TableCell>
                  <TableCell align="center">Supplier</TableCell>
                  <TableCell align="center">Items</TableCell>
                  <TableCell align="center">Quantity</TableCell>
                  <TableCell align="center">Amount</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {
                  rows.map(rtv => <Transaction {...{rtv, suppliers, lastEndOfDay, storeId, deleteRtv, printRtv}} key={rtv._id}  /> )
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


function Transaction({ rtv, suppliers, lastEndOfDay, storeId, deleteRtv, printRtv }){
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
    <TableRow hover>
      <TableCell align="center">{ rtv.rtvNumber  }</TableCell>
      <TableCell align="center">{ moment(rtv.rtvDate).format("DD MMM, YYYY")  }</TableCell>
      <TableCell align="center">{ suppliers[rtv.supplierId] ? suppliers[rtv.supplierId].name : "" }</TableCell>
      <TableCell align="center">{ rtv.totalItems.toLocaleString() }</TableCell>
      <TableCell align="center">{ rtv.totalQuantity.toLocaleString() }</TableCell>
      <TableCell align="center">{ rtv.totalAmount.toLocaleString() }</TableCell>
      
      <TableCell align="right">
        <IconButton onClick={() => printRtv( { ...rtv, supplier: suppliers[rtv.supplierId] } ) } title="Print RTV">
          <FontAwesomeIcon icon={faPrint} size="xs" />
        </IconButton>
        <IconButton component={Link} to={ '/purchase/rtvs/edit/' + storeId + '/' + rtv._id } title="Edit RTV">
          <FontAwesomeIcon icon={faPencilAlt} size="xs" />
        </IconButton>
        {
          (lastEndOfDay && moment(rtv.rtvDate) <= moment(lastEndOfDay)) ? null :
          <IconButton onClick={(event) => handleClick(event) } title="Delete RTV">
              <FontAwesomeIcon icon={faTrash} size="xs" />
            </IconButton>
         }
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
          vertical: "top",
          horizontal: "left",
        }}
        >
        <Box py={2} px={4} textAlign="center">
          <Typography gutterBottom>Do you want to delete this RTV from store?</Typography>
          <Button disableElevation variant="contained" color="primary"  onClick={() => deleteRtv(storeId, rtv._id)}>
            Delete RTV
          </Button>
        </Box>
      </Popover>
  </>
  )
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  const store = state.stores.stores.find(store => store._id === storeId);
  const suppliers = state.suppliers[storeId] ? state.suppliers[storeId] : [];
  const suppliersMap = {};
  for(let i=0; i<suppliers.length; i++)
  {
    suppliersMap[ suppliers[i]._id ] = suppliers[i];
  }

  const rtvs = state.rtvs[storeId] ? state.rtvs[storeId] : {
    records: [],
    totalRecords: 0,
    recordsLoaded: false,
    filters: {}
  }

  return {
    storeId,
    suppliers: suppliersMap,
    ...rtvs,
    loadingRecords: state.progressBar.loading,
    lastEndOfDay: store.lastEndOfDay,
  }
}


export default connect(mapStateToProps, { loadRtvs, emptyRtvs, deleteRtv })(Rtvs);