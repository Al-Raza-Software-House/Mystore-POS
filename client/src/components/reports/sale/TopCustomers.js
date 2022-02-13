import React, { useMemo, useState, useEffect } from 'react';
import { Box, TableContainer, Table, TableBody, TableCell, TableHead, TableRow,  TablePagination, Typography } from '@material-ui/core';
import { connect } from 'react-redux';
import ReactGA from "react-ga4";

function TopCustomers({ records }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/reports/sale/topcustomers", 'title' : "Reports-Sale-TopCustomers" });
  }, []);

  const topCustomers = useMemo(() => {
    let customers = [...records];
    return customers.sort(function(a, b){
      if(a.totalSales > b.totalSales) return -1;
      if(a.totalSales < b.totalSales) return 1;
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
    return topCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [page, rowsPerPage, topCustomers]);
  
  return(
    <>
      {
        topCustomers.length === 0 ?
        <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
          <Typography gutterBottom>No customers found</Typography>
        </Box>
        :
        <Box>
          <TableContainer style={{ height: 'calc(100vh - 220px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell align="center">Sale</TableCell>
                  <TableCell align="center">Return</TableCell>
                  <TableCell align="center">Payment</TableCell>
                  <TableCell align="center">Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {
                  rows.map(record => <Customer {...{record}} key={record._id}  /> )
                }
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100, 250, 500]}
            component="div"
            count={topCustomers.length}
            rowsPerPage={rowsPerPage}
            page={topCustomers.length ? page : 0}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      }
      </>
  )
}


function Customer({ record }){
  return(
    <TableRow hover>
      <TableCell>{ record.name }</TableCell>
      <TableCell align="center"><b style={{ fontSize: 18, color: "#2196f3" }}>{ Math.round(record.totalSales).toLocaleString() }</b></TableCell>
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
    records: state.customers[storeId] ? state.customers[storeId] : []
  }
}


export default connect(mapStateToProps)(TopCustomers);