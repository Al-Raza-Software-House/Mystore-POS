import React, { useMemo, useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faTrash, faSync, faPrint } from '@fortawesome/free-solid-svg-icons';
import { Box, Button, TableContainer, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Popover, TablePagination, Typography } from '@material-ui/core';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { loadGrns, emptyGrns, deleteGrn } from '../../../store/actions/grnActions';
import moment from 'moment';
import GRNFilters from './GrnFilters';

function Grns({ storeId, lastEndOfDay, suppliers, records, filters, totalRecords, recordsLoaded, loadingRecords, loadGrns, emptyGrns, deleteGrn, printGrn }) {
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
          <Typography gutterBottom>No GRNs found</Typography>
          <Button startIcon={ <FontAwesomeIcon icon={faSync} /> } variant="contained" onClick={() => emptyGrns(storeId)} color="primary" disableElevation  >Refresh</Button>
        </Box>
        :
        <Box>
          <TableContainer style={{ maxHeight: 'calc(100vh - 256px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center">GRN No.</TableCell>
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
                  rows.map(grn => <Grn {...{grn, suppliers, storeId, deleteGrn, lastEndOfDay, printGrn}} key={grn._id}  /> )
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


function Grn({ grn, suppliers, storeId, deleteGrn, lastEndOfDay, printGrn }){
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
      <TableCell align="center">{ grn.grnNumber  }</TableCell>
      <TableCell align="center">{ moment(grn.grnDate).format("DD MMM, YYYY")  }</TableCell>
      <TableCell align="center">{ suppliers[grn.supplierId] ? suppliers[grn.supplierId].name : "" }</TableCell>
      <TableCell align="center">{ grn.totalItems.toLocaleString() }</TableCell>
      <TableCell align="center">{ grn.totalQuantity.toLocaleString() }</TableCell>
      <TableCell align="center">{ grn.totalAmount.toLocaleString() }</TableCell>
      
      <TableCell align="right">
        <IconButton onClick={() => printGrn( { ...grn, supplier: suppliers[grn.supplierId] } ) } title="Print GRN">
          <FontAwesomeIcon icon={faPrint} size="xs" />
        </IconButton>
        <IconButton component={Link} to={ '/purchase/grns/edit/' + storeId + '/' + grn._id } title="Edit GRN">
          <FontAwesomeIcon icon={faPencilAlt} size="xs" />
        </IconButton>
        {
          (lastEndOfDay && moment(grn.grnDate) <= moment(lastEndOfDay)) ? null :
          <IconButton onClick={(event) => handleClick(event) } title="Delete GRN">
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
          <Typography gutterBottom>Do you want to delete this GRN from store?</Typography>
          <Button disableElevation variant="contained" color="primary"  onClick={() => deleteGrn(storeId, grn._id)}>
            Delete GRN
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

  const grns = state.grns[storeId] ? state.grns[storeId] : {
    records: [],
    totalRecords: 0,
    recordsLoaded: false,
    filters: {}
  }

  return {
    storeId,
    suppliers: suppliersMap,
    ...grns,
    loadingRecords: state.progressBar.loading,
    lastEndOfDay: store.lastEndOfDay,
  }
}


export default connect(mapStateToProps, { loadGrns, emptyGrns, deleteGrn })(Grns);