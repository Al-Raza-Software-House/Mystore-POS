import React, { useMemo, useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPencilAlt, faTrash, faSync, faMoneyBillAlt, faBookOpen } from '@fortawesome/free-solid-svg-icons';
import { Box, Button, TableContainer, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Popover, TablePagination, Typography, TextField } from '@material-ui/core';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { deleteCustomer } from '../../../store/actions/customerActions';
import moment from 'moment';
import * as fuzzysort from 'fuzzysort';
import _ from "lodash";


function Customers({ storeId, records, deleteCustomer }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [query, setQuery] = useState("");
  const [mobile, setMobile] = useState("");
  const [filteredRecords, setFilteredRecords] = useState([]);
  const inputRef = useRef();
  const mobileInputRef = useRef();

  const totalBalance = useMemo(() => {
    let allBalance = records.map(record => record.currentBalance);
    let total = allBalance.length === 0 ? 0 : allBalance.reduce((total, currentBalance) => total + currentBalance);
    return total;
  }, [records]);

  const handleQueryChange = _.debounce((event) => {
    setQuery(event.target.value);
  }, 300);

  const handleMobileChange = _.debounce((event) => {
    setMobile(event.target.value);
  }, 300);

  useEffect(() => {
      setPage(0);
      let results = records;
      if(query.length >= 3)
      {
        results = fuzzysort.go(query, results, {key:'name'});
        results = results.map(record => record.obj);
      }
      if(mobile.length >= 3)
      {
        results = fuzzysort.go(mobile, results, {key:'mobile'});
        results = results.map(record => record.obj);
      }
      setFilteredRecords(results);
  }, [query, records, mobile]);

  const handleChangePage = (event, newPage) => { 
    setPage(newPage);
   };
  
  const resetSearch = () => {
    inputRef.current.value = '';
    mobileInputRef.current.value = '';
    setQuery("");
    setMobile("");
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  //get only page  rows, use Memo to prevent unneccary render of rows
  const rows = useMemo(() => { 
    return filteredRecords.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [page, rowsPerPage, filteredRecords]);
  
  return(
    <>
      <Box display="flex" justifyContent="space-between" flexWrap="wrap" alignItems="center" mb={2}>
        <Box width={{ xs: '100%', md: '24%' }}>
          <TextField
            variant="outlined"
            margin="dense"
            placeholder="Search by customer name"
            inputRef={inputRef}
            onChange={handleQueryChange}
            fullWidth={true}
          />
        </Box>
        <Box width={{ xs: '100%', md: '24%' }}>
          <TextField
            variant="outlined"
            margin="dense"
            placeholder="Search by mobile number"
            inputRef={mobileInputRef}
            onChange={handleMobileChange}
                        fullWidth={true}

          />
        </Box>
        <Box width={{ xs: '100%', md: '24%' }}>
          Total { totalBalance < 0 ? 'Payable' : "Receivable" }: <b>{ totalBalance.toLocaleString() }</b>
        </Box>
        <Box width={{ xs: '100%', md: '24%' }} textAlign="right">
          <Button startIcon={ <FontAwesomeIcon icon={faPlus} /> } variant="contained" color="primary" disableElevation component={Link} to="/parties/customers/new" >New Customer</Button>
        </Box>
      </Box>
      {
        filteredRecords.length === 0 ?
        <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
          <Typography gutterBottom>No customers found</Typography>
          {
            records.length === 0 ? 
            <Button startIcon={ <FontAwesomeIcon icon={faPlus} /> } variant="contained" color="primary" disableElevation component={Link} to="/parties/customers/new" >Add New Customer</Button>
            :
            <Button startIcon={ <FontAwesomeIcon icon={faSync} /> } variant="contained" onClick={resetSearch} color="primary" disableElevation  >Reset</Button>
          }
        </Box>
        :
        <Box>
          <TableContainer style={{ maxHeight: 'calc(100vh - 256px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell align="center">Mobile</TableCell>
                  <TableCell align="center">Balance</TableCell>
                  <TableCell align="center">Last Sale</TableCell>
                  <TableCell align="center">Last Payment</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {
                  rows.map(record => <Customer {...{record, storeId, deleteCustomer}} key={record._id}  /> )
                }
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100, 250, 500]}
            component="div"
            count={filteredRecords.length}
            rowsPerPage={rowsPerPage}
            page={filteredRecords.length ? page : 0}
            onChangePage={handleChangePage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
          />
        </Box>
      }
      </>
  )
}


function Customer({ record, storeId, deleteCustomer }){
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
      <TableCell>{ record.name }</TableCell>
      <TableCell align="center">{ record.mobile }</TableCell>
      <TableCell align="center">{ record.currentBalance.toLocaleString() }</TableCell>
      <TableCell align="center">{ record.lastSale ? moment(record.lastSale).format("DD MMM, hh:mm A") : "" }</TableCell>
      <TableCell align="center">{ record.lastPayment ? moment(record.lastPayment).format("DD MMM, hh:mm A") : "" }</TableCell>      
      <TableCell align="right">
        <IconButton component={Link} to={ '/parties/customers/receivepayment/' + storeId + '/' + record._id }  title="Receive Payment">
          <FontAwesomeIcon icon={faMoneyBillAlt} size="xs" />
        </IconButton>

        <IconButton component={Link} to={ '/parties/customers/ledger/' + storeId + '/' + record._id }  title="Open Ledger">
          <FontAwesomeIcon icon={faBookOpen} size="xs" />
        </IconButton>

        <IconButton component={Link} to={ '/parties/customers/edit/' + storeId + '/' + record._id }  title="Edit Customer">
          <FontAwesomeIcon icon={faPencilAlt} size="xs" />
        </IconButton>
        <IconButton onClick={(event) => handleClick(event) } title="Delete Customer">
          <FontAwesomeIcon icon={faTrash} size="xs" />
        </IconButton>
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
          <Typography gutterBottom>Do you want to delete this customer from store?</Typography>
          <Button disableElevation variant="contained" color="primary"  onClick={() => deleteCustomer(storeId, record._id)}>
            Delete Customer
          </Button>
        </Box>
      </Popover>
  </>
  )
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  return {
    storeId,
    records: state.customers[storeId] ? state.customers[storeId] : []
  }
}


export default connect(mapStateToProps, { deleteCustomer })(Customers);