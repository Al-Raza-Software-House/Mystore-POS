import React, { useMemo, useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faTrash, faClipboard, faSync } from '@fortawesome/free-solid-svg-icons';
import { Box, Button, TableContainer, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Popover, TablePagination, Typography, Chip } from '@material-ui/core';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { loadTxns, emptyTxns, deleteTxn } from '../../../store/actions/accountActions';
import { paymentModes } from '../../../utils/constants';
import moment from 'moment';
import TransactionsFilters from './TransactionsFilters';

const filtersHeight = 72.5;
function AccountTransactions({ storeId, heads, banks, lastEndOfDay, records, filters, totalRecords, recordsLoaded, loadingRecords, loadTxns, emptyTxns, deleteTxn }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [moreFilters, setMoreFilters] = useState(false);
  const filterRef = useRef();

  let moreFiltersHeight = moreFilters ? filtersHeight : 0;

  useEffect(() => {
    if(filterRef.current !== filters && page !== 0)//filters changed, reset page to 0
      setPage(0);
        filterRef.current = filters;
        if(records.length === 0 && !loadingRecords && !recordsLoaded)// on Page load or filters changed or reset button
          loadTxns(rowsPerPage); 
  }, [filters, records.length, loadingRecords, recordsLoaded, loadTxns, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => { 
    setPage(newPage);
    let pageRecords = records.slice(newPage * rowsPerPage, newPage * rowsPerPage + rowsPerPage);
    if( pageRecords.length < rowsPerPage && records.length < totalRecords )//next page records are 0 or less than rows per page but server has more rows, 
      loadTxns(rowsPerPage);
   };

  const handleChangeRowsPerPage = (event) => {
    let newValue = +event.target.value;
    setRowsPerPage(+event.target.value);
    setPage(0);
    if( records.length < newValue && records.length < totalRecords ) //there are more rows on server and current rows are less then recordsPerPage
    {
      loadTxns(newValue);
    }
  };

  //get only page  rows, use Memo to prevent unneccary render of rows
  const rows = useMemo(() => {
    return records.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [page, rowsPerPage, records]);
  
  return(
    <>
      <TransactionsFilters {...{moreFilters, setMoreFilters }} />
      {
        records.length === 0 && recordsLoaded && !loadingRecords ?
        <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
          <Typography gutterBottom>No transactions found</Typography>
          <Button startIcon={ <FontAwesomeIcon icon={faSync} /> } variant="contained" onClick={() => emptyTxns(storeId)} color="primary" disableElevation  >Refresh</Button>
        </Box>
        :
        <Box>
          <TableContainer style={{ maxHeight: 'calc(100vh - '+ (256 + moreFiltersHeight ) +'px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell align="center">Amount</TableCell>
                  <TableCell align="center">Type</TableCell>
                  <TableCell align="center">Bank</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {
                  rows.map(txn => <Transaction {...{txn, banks, heads, lastEndOfDay, storeId, deleteTxn}} key={txn._id}  /> )
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


function Transaction({ txn, banks, heads, storeId, lastEndOfDay, deleteTxn }){
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
      <TableCell align="center">{ txn.amount.toLocaleString() }</TableCell>
      <TableCell align="center">
        { txn.type === paymentModes.PAYMENT_MODE_BANK ? <Chip label="bank" /> : null }
        { txn.type === paymentModes.PAYMENT_MODE_CASH ? <Chip label="cash" color="primary" /> : null }
      </TableCell>
      <TableCell align="center">{ banks[txn.bankId] ? banks[txn.bankId].name : "" }</TableCell>
      <TableCell>{ txn.description }</TableCell>
      
      <TableCell align="right">
        {
          heads[txn.headId].systemHead || (heads[txn.headId].name === "Bank Account" && txn.type === paymentModes.PAYMENT_MODE_BANK)  || (lastEndOfDay && moment(txn.time) <= moment(lastEndOfDay)) ? null : 
          <>
            <IconButton component={Link} to={ '/accounts/transactions/edit/' + storeId + '/' + txn._id } title="Edit Transaction">
              <FontAwesomeIcon icon={faPencilAlt} size="xs" />
            </IconButton>
            <IconButton onClick={(event) => handleClick(event) } title="Delete Transaction">
              <FontAwesomeIcon icon={faTrash} size="xs" />
            </IconButton>
          </>
        }
        { txn.notes ? <Notes notes={txn.notes} /> : null }
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
          <Typography gutterBottom>Do you want to delete this transaction from store?</Typography>
          <Button disableElevation variant="contained" color="primary"  onClick={() => deleteTxn(storeId, txn._id)}>
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
  const heads = state.accounts.heads[storeId] ? state.accounts.heads[storeId] : [];
  const headsMap = {};
  for(let i=0; i<heads.length; i++)
  {
    headsMap[ heads[i]._id ] = heads[i];
  }

  const banks = state.accounts.banks[storeId] ? state.accounts.banks[storeId] : [];
  const banksMap = {};
  for(let i=0; i<banks.length; i++)
  {
    banksMap[ banks[i]._id ] = banks[i];
  }

  const storeTxns = state.accounts.transactions[storeId] ? state.accounts.transactions[storeId] : {
    records: [],
    totalRecords: 0,
    recordsLoaded: false,
    filters: {}
  }

  return {
    storeId,
    heads: headsMap,
    banks: banksMap,
    ...storeTxns,
    lastEndOfDay: store.lastEndOfDay,
    loadingRecords: state.progressBar.loading
  }
}


export default connect(mapStateToProps, { loadTxns, emptyTxns, deleteTxn })(AccountTransactions);