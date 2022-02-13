import React, { useMemo, useState, useEffect } from 'react';
import { Box, TableContainer, Table, TableBody, TableCell, TableHead, TableRow,  TablePagination, Typography } from '@material-ui/core';
import { connect } from 'react-redux';
import ReactGA from "react-ga4";

function TopSuppliers({ records }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/reports/purchase/topSuppliers", 'title' : "Reports-Sale-TopSuppliers" });
  }, []);

  const topSuppliers = useMemo(() => {
    let suppliers = [...records];
    return suppliers.sort(function(a, b){
      if(a.totalPurchases > b.totalPurchases) return -1;
      if(a.totalPurchases < b.totalPurchases) return 1;
      return 0;
    });
  }, [records])

  const handleChangePage = (event, newPage) => { 
    setPage(newPage);
   };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  //get only page  rows, use Memo to prevent unneccary render of rows
  const rows = useMemo(() => { 
    return topSuppliers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [page, rowsPerPage, topSuppliers]);
  
  return(
    <>
      {
        topSuppliers.length === 0 ?
        <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
          <Typography gutterBottom>No suppliers found</Typography>
        </Box>
        :
        <Box>
          <TableContainer style={{ height: 'calc(100vh - 220px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell align="center">Purchase</TableCell>
                  <TableCell align="center">Return</TableCell>
                  <TableCell align="center">Payment</TableCell>
                  <TableCell align="center">Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {
                  rows.map(record => <Supplier {...{record}} key={record._id}  /> )
                }
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100, 250, 500]}
            component="div"
            count={topSuppliers.length}
            rowsPerPage={rowsPerPage}
            page={topSuppliers.length ? page : 0}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      }
      </>
  )
}


function Supplier({ record }){
  return(
    <TableRow hover>
      <TableCell>{ record.name }</TableCell>
      <TableCell align="center"><b style={{ fontSize: 18, color: "#2196f3" }}>{ Math.round(record.totalPurchases).toLocaleString() }</b></TableCell>
      <TableCell align="center">{ Math.round(record.totalReturns).toLocaleString() }</TableCell>
      <TableCell align="center">{ Math.round(record.totalPayment).toLocaleString() }</TableCell>
      <TableCell align="center">{ Math.round(record.currentBalance).toLocaleString() }</TableCell>
    </TableRow>
  )
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  return {
    storeId,
    records: state.suppliers[storeId] ? state.suppliers[storeId] : []
  }
}


export default connect(mapStateToProps)(TopSuppliers);