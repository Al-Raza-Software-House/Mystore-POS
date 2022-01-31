import React, { useMemo, useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faSync, faPrint } from '@fortawesome/free-solid-svg-icons';
import { Box, Button, TableContainer, Table, TableBody, TableCell, TableHead, TableRow, IconButton, TablePagination, Typography } from '@material-ui/core';
import { connect, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { loadSales, emptySales } from '../../store/actions/saleActions';
import moment from 'moment';
import SaleFilters from './SaleFilters';
import { isOwner } from 'utils';
import ReactGA from "react-ga4";

function Sales({ storeId, records, filters, totalRecords, recordsLoaded, loadingRecords, loadSales, emptySales, printSale }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const filterRef = useRef();
  const userRole = useSelector(state => state.stores.userRole);
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/sale/list", 'title' : "Sale History" });
  }, []);

  useEffect(() => {
    if(filterRef.current !== filters && page !== 0)//filters changed, reset page to 0
      setPage(0);
    filterRef.current = filters;
    if(records.length === 0 && !loadingRecords && !recordsLoaded)// on Page load or filters changed or reset button
      loadSales(rowsPerPage); 
  }, [filters, records.length, loadingRecords, recordsLoaded, loadSales, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => { 
    setPage(newPage);
    let pageRecords = records.slice(newPage * rowsPerPage, newPage * rowsPerPage + rowsPerPage);
    if( pageRecords.length < rowsPerPage && records.length < totalRecords )//next page records are 0 or less than rows per page but server has more rows, 
      loadSales(rowsPerPage);
   };

  const handleChangeRowsPerPage = (event) => {
    let newValue = +event.target.value;
    setRowsPerPage(+event.target.value);
    setPage(0);
    if( records.length < newValue && records.length < totalRecords ) //there are more rows on server and current rows are less then recordsPerPage
    {
      loadSales(newValue);
    }
  };

  //get only page  rows, use Memo to prevent unneccary render of rows
  const rows = useMemo(() => {
    return records.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [page, rowsPerPage, records]);
  
  return(
    <>
      <SaleFilters />
      {
        records.length === 0 && recordsLoaded && !loadingRecords ?
        <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
          <Typography gutterBottom>No Sales found</Typography>
          <Button startIcon={ <FontAwesomeIcon icon={faSync} /> } variant="contained" onClick={() => emptySales(storeId)} color="primary" disableElevation  >Refresh</Button>
        </Box>
        :
        <Box>
          <TableContainer style={{ maxHeight: 'calc(100vh - 256px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center">Receipt #</TableCell>
                  <TableCell align="center">Date</TableCell>
                  <TableCell align="center">Items</TableCell>
                  <TableCell align="center">Quantity</TableCell>
                  <TableCell align="center">Discount</TableCell>
                  <TableCell align="center">Adjustment</TableCell>
                  <TableCell align="center">Amount</TableCell>
                  { !isOwner(userRole) ? null : <TableCell align="center">Profit</TableCell> }
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {
                  rows.map(sale => <Sale {...{sale, storeId, printSale, userRole}} key={sale._id}  /> )
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


function Sale({ sale, storeId, printSale, userRole }){
  return(
    <>
    <TableRow hover style={{ textDecoration: sale.isVoided ? "line-through" : "none", backgroundColor: sale.isVoided ? "#7c7c7c" : "transparent" }}>
      <TableCell align="center">{ sale.saleNumber  }</TableCell>
      <TableCell align="center">{ moment(sale.saleDate).format("DD MMM, YYYY hh:mm A")  }</TableCell>
      <TableCell align="center">{ sale.totalItems.toLocaleString() }</TableCell>
      <TableCell align="center">{ sale.totalQuantity.toLocaleString() }</TableCell>
      <TableCell align="center">{ sale.totalDiscount.toLocaleString() }</TableCell>
      <TableCell align="center">{ sale.adjustment.toLocaleString() }</TableCell>
      <TableCell align="center">{ sale.totalAmount.toLocaleString() }</TableCell>
      { !isOwner(userRole) ? null : <TableCell align="center">{ sale.profit.toLocaleString() }</TableCell> }
      
      <TableCell align="right">
        <IconButton onClick={() => printSale( sale ) } title="Print Sale">
          <FontAwesomeIcon icon={faPrint} size="xs" />
        </IconButton>
        <IconButton component={Link} to={ '/sale/view/' + storeId + '/' + sale._id } title="View Sale">
          <FontAwesomeIcon icon={faPencilAlt} size="xs" />
        </IconButton>
      </TableCell>
    </TableRow>
  </>
  )
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  const sales = state.sales[storeId] ? state.sales[storeId] : {
    records: [],
    totalRecords: 0,
    recordsLoaded: false,
    filters: {}
  }

  return {
    storeId,
    ...sales,
    loadingRecords: state.progressBar.loading,
  }
}


export default connect(mapStateToProps, { loadSales, emptySales })(Sales);