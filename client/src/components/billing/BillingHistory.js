import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@material-ui/core';
import { loadBillingHistory } from '../../store/actions/storeActions';
import moment from 'moment';

function BillingHistory({ transactions, selectedStoreId, loadBillingHistory }){
  useEffect(() => {
    loadBillingHistory(selectedStoreId);
  }, [loadBillingHistory, selectedStoreId]);
  return(
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell align="center">Payment Date</TableCell>
            <TableCell align="center">Amount</TableCell>
            <TableCell align="center">EasyPaisa Account</TableCell>
            <TableCell align="center">Prev Expiry Date</TableCell>
            <TableCell align="center">New Expiry Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {
            transactions.map(item => <Transaction item={item} key={item._id} /> )
          }
        </TableBody>
      </Table>
    </TableContainer>
  )
}

const Transaction = ({ item }) => {
  return (
    <TableRow hover>
      <TableCell align="center">{ moment(item.time).format('D MMMM, YYYY hh:mm A') }</TableCell>
      <TableCell align="center">Rs.{item.amount}</TableCell>
      <TableCell align="center">{item.mobileAccountNumber}</TableCell>
      <TableCell align="center"> {moment(item.prevExpiryDate).format('D MMMM, YYYY hh:mm A')} </TableCell>
      <TableCell align="center"> {moment(item.nextExpiryDate).format('D MMMM, YYYY hh:mm A')} </TableCell>
    </TableRow>
  )
}

const mapStateToProps = state => {
  const store = state.stores.stores.find(item => item._id === state.stores.selectedStoreId);
  const transactions = store.billingHistory ? store.billingHistory : [];
  return {
    selectedStoreId: state.stores.selectedStoreId,
    transactions
  }
}

export default connect(mapStateToProps, { loadBillingHistory })(BillingHistory);