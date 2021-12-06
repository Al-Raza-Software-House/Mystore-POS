import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faTrash, faPlus, faClipboard, faSync, faPrint } from '@fortawesome/free-solid-svg-icons';
import { Box, Button, TableContainer, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Popover, TablePagination, Typography, Chip } from '@material-ui/core';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { customerTxns } from '../../../utils/constants';
import moment from 'moment';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DateRangeFilter from '../../library/form/DateRangeFilter';
import axios from 'axios';
import { hideProgressBar, showProgressBar } from '../../../store/actions/progressActions';
import { showError, showSuccess } from '../../../store/actions/alertActions';
import { actionTypes as accountActions } from '../../../store/actions/accountActions';
import { updateCustomer } from '../../../store/actions/customerActions';

function CustomerLedger({ lastEndOfDay, banks, printTxn, loadingRecords, dispatch }) {
  const { storeId, customerId } = useParams();
  const customer = useSelector( state =>  state.customers[storeId].find(item => item._id === customerId) );
  const [dateRange, setDateRange] = useState(() => {
    return moment().subtract(30, 'days').format("DD MMM, YYYY") + " - " + moment().format("DD MMM, YYYY")
  });
  const [records, setRecords] = useState([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    setPage(0);
    setRecords([]);
    setRecordsLoaded(false);
  }, [dateRange])

  const [stats, setStats] = useState({
    totalRecords: 0,
    openingBalance: 0,
    totalSales: 0,
    totalReturns: 0,
    totalPayment: 0,
    netBalance: 0
  });

 const loadTxns = useCallback(() => {
    let skip = records.length;
    dispatch( showProgressBar() );
    axios.post('/api/customers/ledger', { storeId, customerId, dateRange, skip, recordsPerPage: rowsPerPage} ).then( ({ data }) => {
      dispatch( hideProgressBar() );
      setRecords((preRecords) => ([...preRecords, ...data.txns]));
      setStats(data.stats);
      setRecordsLoaded(true);
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch( showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }, [storeId, customerId, dispatch, records.length, rowsPerPage, dateRange]);

  useEffect(() => {
    if(records.length === 0 && !recordsLoaded)
      loadTxns();
  }, [loadTxns, records.length, recordsLoaded]);

  const deleteTxn = useCallback((txnId) => {
    dispatch(showProgressBar());
    axios.post('/api/customers/deletePayment', { storeId, customerId, txnId }).then( ({ data }) => {
      dispatch(hideProgressBar());
      dispatch( { type: accountActions.TRANSACTION_DELETED, storeId, txnId: data.accountTxnId } );
      if(data.customer)
        dispatch( updateCustomer(storeId, customerId, data.customer, data.now, data.lastAction) )
      setPage(0);
      setRecords([]);
      setRecordsLoaded(false);
      dispatch( showSuccess('Transaction deleted') );
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }, [dispatch, storeId, customerId]);
  

  const handleChangePage = (event, newPage) => { 
    setPage(newPage);
    let pageRecords = records.slice(newPage * rowsPerPage, newPage * rowsPerPage + rowsPerPage);
    if( pageRecords.length < rowsPerPage && records.length < stats.totalRecords )//next page records are 0 or less than rows per page but server has more rows, 
      loadTxns();
   };

  const handleChangeRowsPerPage = (event) => {
    let newValue = +event.target.value;
    setRowsPerPage(+event.target.value);
    setPage(0);
    if( records.length < newValue && records.length < stats.totalRecords ) //there are more rows on server and current rows are less then recordsPerPage
    {
      loadTxns();
    }
  };
  let balance = useMemo(() => {
    let total = stats.openingBalance;
    let prevPagesRecords = [];
    if(page > 0)
      prevPagesRecords = records.slice(0, page * rowsPerPage);
    prevPagesRecords.forEach(element => total += element.amount);
    return total;
  }, [stats.openingBalance, page, rowsPerPage, records]);

  //get only page  rows, use Memo to prevent unneccary render of rows
  const rows = useMemo(() => {
    return records.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [page, rowsPerPage, records]);
  

  return(
    <>
      <Typography gutterBottom variant="h6" align="center">{ customer.name } - Ledger</Typography>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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
        <Box flexGrow={1} display="flex" justifyContent="space-between" px={5}> 
          <Typography>Opening Balance: <b>{ stats.openingBalance.toLocaleString() }</b> </Typography>
          <Typography>Net Balance: <b>{ stats.netBalance.toLocaleString() }</b> </Typography>
        </Box>
        <Box pt={1} minWidth="160px" display="flex" justifyContent="center">
          <Button startIcon={ <FontAwesomeIcon icon={faPlus} /> } variant="contained" color="primary" disableElevation component={Link} to={`/parties/customers/receivepayment/${storeId}/${customerId}`} >Pay/Receive</Button>
        </Box>
      </Box>
      {
        records.length === 0 && recordsLoaded && !loadingRecords ?
        <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
          <Typography gutterBottom>No transactions found</Typography>
          <Button startIcon={ <FontAwesomeIcon icon={faSync} /> } variant="contained" onClick={() => loadTxns()} color="primary" disableElevation  >Refresh</Button>
        </Box>
        :
        <Box>
          <TableContainer style={{ maxHeight: 'calc(100vh - '+ (290) +'px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell align="center">Type</TableCell>
                  <TableCell align="center">Amount</TableCell>
                  <TableCell align="center">Balance</TableCell>
                  <TableCell align="center">Bank</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {
                  rows.map(txn => {
                    balance += txn.amount;
                    return (
                      <Transaction {...{txn, banks, lastEndOfDay, storeId, customerId, deleteTxn, balance, customer, printTxn}}  key={txn._id}  />
                    )
                  } )
                }
              </TableBody>
            </Table>
          </TableContainer>
          <Box width="100%" display="flex" justifyContent="space-between" alignItems="center">
            <Typography>Total Sales: <b>{ stats.totalSales.toLocaleString() }</b> </Typography>
            <Typography>Total Returns: <b>{ stats.totalReturns.toLocaleString() }</b> </Typography>
            <Typography>Total Payment: <b>{ stats.totalPayment.toLocaleString() }</b> </Typography>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100, 250, 500]}
              component="div"
              count={stats.totalRecords}
              rowsPerPage={rowsPerPage}
              page={stats.totalRecords ? page : 0}
              onChangePage={handleChangePage}
              onChangeRowsPerPage={handleChangeRowsPerPage}
            />
          </Box>
        </Box>
      }
      </>
  )
}


function Transaction({ txn, balance, banks, storeId, customerId, customer, printTxn, lastEndOfDay, deleteTxn }){
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
      <TableCell>{ moment(txn.time).format("DD MMM, hh:mm A")  }</TableCell>
      <TableCell align="center">
        { txn.type === customerTxns.CUSTOMER_TXN_TYPE_PAYMENT ? <Chip label="Payment" color="primary" /> : null }
        { txn.type === customerTxns.CUSTOMER_TXN_TYPE_SALE ? <Chip label="Sale" /> : null }
        { txn.type === customerTxns.CUSTOMER_TXN_TYPE_SALE ? <Chip label="Return" variant="outlined" /> : null }
      </TableCell>
      <TableCell align="center">{ txn.amount.toLocaleString() }</TableCell>
      <TableCell align="center">{ balance.toLocaleString() }</TableCell>
      <TableCell align="center">{ txn.bankId ? banks[txn.bankId].name : null } </TableCell>
      <TableCell>{ txn.description }</TableCell>
      
      <TableCell align="right">
        { txn.notes ? <Notes notes={txn.notes} /> : null }
        {
          !txn.saleId && txn.type === customerTxns.CUSTOMER_TXN_TYPE_PAYMENT ? 
          <IconButton onClick={() => printTxn( { ...txn, customer } ) } title="Print Receipt">
            <FontAwesomeIcon icon={faPrint} size="xs" />
          </IconButton>
          : null
        }
        {
          txn.saleId || (lastEndOfDay && moment(txn.time) <= moment(lastEndOfDay)) ? null : 
          <>
            <IconButton component={Link} to={ '/parties/customers/editpayment/' + customerId + '/' + txn._id } title="Edit Transaction">
              <FontAwesomeIcon icon={faPencilAlt} size="xs" />
            </IconButton>
            <IconButton onClick={(event) => handleClick(event) } title="Delete Transaction">
              <FontAwesomeIcon icon={faTrash} size="xs" />
            </IconButton>
          </>
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
          <Typography gutterBottom>Do you want to delete this entry from customer ledger?</Typography>
          <Button disableElevation variant="contained" color="primary" onClick={() => deleteTxn(txn._id)} >
            Delete Transaction
          </Button>
        </Box>
      </Popover>
  </>
  )
}

function Notes({ notes }){
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;
  return (
    <>
      <IconButton title="Notes" onClick={handleClick}>
        <FontAwesomeIcon icon={faClipboard} size="xs" />
      </IconButton>
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
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box p={2}>
          <Typography>{notes}</Typography>
        </Box>
      </Popover>
    </>
  )
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  const store = state.stores.stores.find(store => store._id === storeId);
  const banks = state.accounts.banks[storeId] ? state.accounts.banks[storeId] : [];
  const banksMap = {};
  for(let i=0; i<banks.length; i++)
  {
    banksMap[ banks[i]._id ] = banks[i];
  }

  return {
    storeId,
    banks: banksMap,
    lastEndOfDay: store.lastEndOfDay,
    loadingRecords: state.progressBar.loading
  }
}


export default connect(mapStateToProps)(CustomerLedger);