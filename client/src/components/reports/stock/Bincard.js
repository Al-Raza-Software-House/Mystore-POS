import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup, faSync } from '@fortawesome/free-solid-svg-icons';
import { Box, Button, TableContainer, Table, TableBody, TableCell, TableHead, TableRow, Popover, TablePagination, Typography, Badge, makeStyles, IconButton } from '@material-ui/core';
import { connect } from 'react-redux';
import moment from 'moment';
import DateRangeFilter from '../../library/form/DateRangeFilter';
import axios from 'axios';
import { hideProgressBar, showProgressBar } from '../../../store/actions/progressActions';
import { showError } from '../../../store/actions/alertActions';
import ReactGA from "react-ga4";
import SelectItem from 'components/library/SelectItem';
import clsx from 'clsx';

const defaultStats = {
    totalRecords: 0,
    openingStock: 0,
    netStock: 0
  }
const dateFormat = "DD-MM-YYYY";

function Bincard({ storeId, reasons, loadingRecords, dispatch }) {
  const [dateRange, setDateRange] = useState(() => {
    return moment().subtract(30, 'days').format("DD MMM, YYYY") + " - " + moment().format("DD MMM, YYYY")
  });

  const [itemId, setItemId] = useState(null);

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/reports/stock/bincard", 'title' : "Reports-Stock-Bincard" });
  }, []);

  const [records, setRecords] = useState([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedTxn, setSelectedTxn] = useState(null); //item selected for delete
  const [batchesAnchorEl, setBatchesAnchorEl] = useState(null);

  const showBatches = useCallback((event, txn) => {
    setSelectedTxn(txn);
    setBatchesAnchorEl(event.currentTarget);
  }, []);

  const [stats, setStats] = useState(defaultStats);

  useEffect(() => {
    setPage(0);
    setRecords([]);
    setRecordsLoaded(false);
    setStats(defaultStats);
  }, [dateRange, itemId])

 const loadTxns = useCallback(() => {
   if(!itemId) return setRecordsLoaded(true);
    let skip = records.length;
    dispatch( showProgressBar() );
    axios.post('/api/reports/stock/bincard', { storeId, itemId, dateRange, skip, recordsPerPage: rowsPerPage} ).then( ({ data }) => {
      dispatch( hideProgressBar() );
      setRecords((preRecords) => ([...preRecords, ...data.txns]));
      setStats(data.stats);
      setRecordsLoaded(true);
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch( showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }, [storeId, itemId, dispatch, records.length, rowsPerPage, dateRange]);

  useEffect(() => {
    if(records.length === 0 && !recordsLoaded)
      loadTxns();
  }, [loadTxns, records.length, recordsLoaded]);
  

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
    let total = stats.openingStock;
    let prevPagesRecords = [];
    if(page > 0)
      prevPagesRecords = records.slice(0, page * rowsPerPage);
    prevPagesRecords.forEach(element => total += element.quantity);
    return total;
  }, [stats.openingStock, page, rowsPerPage, records]);

  //get only page  rows, use Memo to prevent unneccary render of rows
  const rows = useMemo(() => {
    return records.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [page, rowsPerPage, records]);

  return(
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" >
        <Box width={{ xs: '100%', md: '30%' }} mr={2}>
          <SelectItem value={itemId} onChange={setItemId} />
        </Box>
        <Box width={{ xs: '100%', md: '30%' }}>
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
          <Typography>Opening Stock: <b>{ stats.openingStock.toLocaleString() }</b> </Typography>
          <Typography>Net Stock: <b>{ stats.netStock.toLocaleString() }</b> </Typography>
        </Box>
      </Box>
      {
        records.length === 0 && recordsLoaded && !loadingRecords ?
        <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
          { itemId ? <Typography gutterBottom>No stock transactions found in this period</Typography> : <Typography gutterBottom>Please select an item to find it's transaction history</Typography> }
          { itemId ? <Button startIcon={ <FontAwesomeIcon icon={faSync} /> } variant="contained" onClick={() => loadTxns()} color="primary" disableElevation  >Refresh</Button> : null }
        </Box>
        :
        <Box>
          <TableContainer style={{ height: 'calc(100vh - '+ (270) +'px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell width="120px">Time</TableCell>
                  <TableCell align="center">Type</TableCell>
                  <TableCell align="center">Ref</TableCell>
                  <TableCell align="center">Quantity</TableCell>
                  <TableCell align="center">Stock</TableCell>
                  <TableCell align="center">Batches</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {
                  rows.map(txn => {
                    balance += txn.quantity;
                    return (
                      <Transaction {...{txn, storeId, itemId, balance, reasons, showBatches}}  key={txn._id}  />
                    )
                  } )
                }
              </TableBody>
            </Table>
          </TableContainer>
          <Box width="100%" display="flex" justifyContent="flex-end" alignItems="center">
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100, 250, 500]}
              component="div"
              count={stats.totalRecords}
              rowsPerPage={rowsPerPage}
              page={stats.totalRecords ? page : 0}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Box>
        </Box>
      }
      <BatchesPopOver {...{batchesAnchorEl, setBatchesAnchorEl}} txn={selectedTxn}  />
      </>
  )
}

const useStyles = makeStyles(theme => ({
  badge: {
    minWidth: 130
  },
  badgePurchase:{
    backgroundColor: "green"
  },
  badgeSupplierReturn:{
    backgroundColor: "#e36900"
  },
  badgeAdjustment:{
    backgroundColor: "#000000"
  }
}));

function Transaction({ txn, balance, reasons, showBatches }){
  const classes = useStyles();
  return(
    <>
    <TableRow hover>
      <TableCell>{ moment(txn.time).format("DD MMM, hh:mm A")  }</TableCell>
      <TableCell align="center">
        { txn.reasonId ? <Badge classes={{ badge: clsx(classes.badge, classes.badgeAdjustment)  }} badgeContent="Adjustment" color="error" /> : null }
        { txn.grnId ? <Badge classes={{ badge: clsx(classes.badge, classes.badgePurchase)   }} badgeContent="Purchase" color="error"  /> : null }
        { txn.rtvId ? <Badge classes={{ badge: clsx(classes.badge, classes.badgeSupplierReturn)   }} badgeContent="Supplier Return" color="secondary" /> : null }
        { txn.saleId && txn.quantity < 0 ? <Badge classes={{ badge: classes.badge  }} badgeContent="Sale" color="primary" /> : null }
        { txn.saleId && txn.quantity > 0 ? <Badge classes={{ badge: classes.badge  }} badgeContent="Customer Return" color="secondary" /> : null }
      </TableCell>
      <TableCell align="center">
        { txn.reasonId && reasons[txn.reasonId] ? reasons[txn.reasonId].name : "" }
      </TableCell>
      <TableCell align="center">{ txn.quantity.toLocaleString() }</TableCell>
      <TableCell align="center">{ balance.toLocaleString() }</TableCell>
      <TableCell align="center">
        { 
          txn.batches && txn.batches.length ? 
          <IconButton onClick={(event) => showBatches(event, txn) } title="Txn Batches"> <FontAwesomeIcon icon={faLayerGroup} size="xs" /> </IconButton>
          : null
        }
      </TableCell>
      
      
    </TableRow>
  </>
  )
}

const BatchesPopOver = React.memo(
  function ({ batchesAnchorEl, setBatchesAnchorEl, txn }){
    const classes = useStyles();
    const handleClose = () => {
      setBatchesAnchorEl(null);
    };
    const open = Boolean(batchesAnchorEl);
    const id = open ? 'batches-popover' : undefined;
    if(!txn || !txn.batches || txn.batches.length === 0) return null;
    return(
      <Popover 
        id={id}
        open={open}
        anchorEl={batchesAnchorEl}
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
        <Box py={2} px={4} textAlign="center">
          <Typography gutterBottom align="center">
            { txn.reasonId ? <Badge classes={{ badge: clsx(classes.badge, classes.badgeAdjustment)  }} badgeContent={`Adjustment (${txn.quantity})`} color="error" /> : null }
            { txn.grnId ? <Badge classes={{ badge: clsx(classes.badge, classes.badgePurchase)   }} badgeContent={`Purchase (${txn.quantity})`} color="error"  /> : null }
            { txn.rtvId ? <Badge classes={{ badge: clsx(classes.badge, classes.badgeSupplierReturn)   }} badgeContent={`Supplier Return (${txn.quantity})`} color="secondary" /> : null }
            { txn.saleId && txn.quantity < 0 ? <Badge classes={{ badge: classes.badge  }} badgeContent={`Sale (${txn.quantity})`} color="primary" /> : null }
            { txn.saleId && txn.quantity > 0 ? <Badge classes={{ badge: classes.badge  }} badgeContent={`Customer Return (${txn.quantity})`} color="secondary" /> : null }
            <b>{txn.quantity}</b>
          </Typography>
          <Table>
            <TableBody>
              {
                txn.batches.map(batch => (
                  <TableRow key={batch._id}>
                    <TableCell><Typography style={{ color: '#6c6a6a', fontSize: 14 }}>{ batch.batchNumber }</Typography></TableCell>
                    <TableCell>
                      { moment(batch.batchExpiryDate).format(dateFormat) }
                    </TableCell>
                    <TableCell>
                      { batch.batchQuantity }
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </Box>
      </Popover>
    )
  }
)


const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  const reasons = state.adjustmentReasons[storeId] ? state.adjustmentReasons[storeId] : [];
  const reasonsMap = {};
  for(let i=0; i<reasons.length; i++)
  {
    reasonsMap[ reasons[i]._id ] = reasons[i];
  }

  return {
    storeId,
    reasons: reasonsMap,
    loadingRecords: state.progressBar.loading
  }
}


export default connect(mapStateToProps)(Bincard);