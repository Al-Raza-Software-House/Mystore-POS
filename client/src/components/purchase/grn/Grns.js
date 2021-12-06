import React, { useMemo, useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faTrash, faSync, faPrint } from '@fortawesome/free-solid-svg-icons';
import { Box, Button, TableContainer, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Popover, TablePagination, Typography, Chip } from '@material-ui/core';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { loadGrns, emptyGrns, deleteGrn } from '../../../store/actions/grnActions';
import { poStates } from '../../../utils/constants';
import moment from 'moment';
import GRNFilters from './GrnFilters';

function Grns({ storeId, suppliers, records, filters, totalRecords, recordsLoaded, loadingRecords, loadGrns, emptyGrns, deleteGrn, printGRN }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const filterRef = useRef();

  useEffect(() => {
    if(filterRef.current !== filters && page !== 0)//filters changed, reset page to 0
      setPage(0);
    filterRef.current = filters;
    if(records.length === 0 && !loadingRecords && !recordsLoaded)// on Page load or filters changed or reset button
      loadGrns(rowsPerPage); 
  }, [filters, records.length, loadingRecords, recordsLoaded, loadGrns, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => { 
    setPage(newPage);
    let pageRecords = records.slice(newPage * rowsPerPage, newPage * rowsPerPage + rowsPerPage);
    if( pageRecords.length < rowsPerPage && records.length < totalRecords )//next page records are 0 or less than rows per page but server has more rows, 
      loadGrns(rowsPerPage);
   };

  const handleChangeRowsPerPage = (event) => {
    let newValue = +event.target.value;
    setRowsPerPage(+event.target.value);
    setPage(0);
    if( records.length < newValue && records.length < totalRecords ) //there are more rows on server and current rows are less then recordsPerPage
    {
      loadGrns(newValue);
    }
  };

  //get only page  rows, use Memo to prevent unneccary render of rows
  const rows = useMemo(() => {
    return records.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [page, rowsPerPage, records]);
  
  return(
    <>
      <GRNFilters />
      {
        records.length === 0 && recordsLoaded && !loadingRecords ?
        <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
          <Typography gutterBottom>No purchase orders found</Typography>
          <Button startIcon={ <FontAwesomeIcon icon={faSync} /> } variant="contained" onClick={() => emptyGrns(storeId)} color="primary" disableElevation  >Refresh</Button>
        </Box>
        :
        <Box>
          <TableContainer style={{ maxHeight: 'calc(100vh - 256px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center">Po No.</TableCell>
                  <TableCell align="center">Issue Date</TableCell>
                  <TableCell align="center">Supplier</TableCell>
                  <TableCell align="center">Items</TableCell>
                  <TableCell align="center">Quantity</TableCell>
                  <TableCell align="center">Amount</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {
                  rows.map(order => <Transaction {...{order, suppliers, storeId, deleteGrn, printGRN}} key={order._id}  /> )
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
            onChangePage={handleChangePage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
          />
        </Box>
      }
      </>
  )
}


function Transaction({ order, suppliers, storeId, deleteGrn, printGRN }){
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
      <TableCell align="center">{ order.poNumber  }</TableCell>
      <TableCell align="center">{ moment(order.issueDate).format("DD MMM, YYYY")  }</TableCell>
      <TableCell align="center">{ suppliers[order.supplierId] ? suppliers[order.supplierId].name : "" }</TableCell>
      <TableCell align="center">{ order.totalItems.toLocaleString() }</TableCell>
      <TableCell align="center">{ order.totalQuantity.toLocaleString() }</TableCell>
      <TableCell align="center">{ order.totalAmount.toLocaleString() }</TableCell>

      <TableCell align="center">
        { order.status === poStates.PO_STATUS_OPEN ? <Chip label="Open" color="primary" /> : null }
        { order.status === poStates.PO_STATUS_CLOSED ? <Chip label="Closed"  /> : null }
      </TableCell>
      
      <TableCell align="right">
        <IconButton onClick={() => printGRN( { ...order, supplier: suppliers[order.supplierId] } ) } title="Print Receipt">
          <FontAwesomeIcon icon={faPrint} size="xs" />
        </IconButton>
        {
          order.status === poStates.PO_STATUS_OPEN ? 
          <>
            <IconButton component={Link} to={ '/purchase/orders/edit/' + storeId + '/' + order._id } title="Edit Purchase Order">
              <FontAwesomeIcon icon={faPencilAlt} size="xs" />
            </IconButton>
            <IconButton onClick={(event) => handleClick(event) } title="Delete Purchase Order">
              <FontAwesomeIcon icon={faTrash} size="xs" />
            </IconButton>
          </>
          : null
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
          <Typography gutterBottom>Do you want to delete this order from store?</Typography>
          <Button disableElevation variant="contained" color="primary"  onClick={() => deleteGrn(storeId, order._id)}>
            Delete Purchase Order
          </Button>
        </Box>
      </Popover>
  </>
  )
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  const suppliers = state.suppliers[storeId] ? state.suppliers[storeId] : [];
  const suppliersMap = {};
  for(let i=0; i<suppliers.length; i++)
  {
    suppliersMap[ suppliers[i]._id ] = suppliers[i];
  }

  const purchaseOrders = state.purchaseOrders[storeId] ? state.purchaseOrders[storeId] : {
    records: [],
    totalRecords: 0,
    recordsLoaded: false,
    filters: {}
  }

  return {
    storeId,
    suppliers: suppliersMap,
    ...purchaseOrders,
    loadingRecords: state.progressBar.loading
  }
}


export default connect(mapStateToProps, { loadGrns, emptyGrns, deleteGrn })(Grns);