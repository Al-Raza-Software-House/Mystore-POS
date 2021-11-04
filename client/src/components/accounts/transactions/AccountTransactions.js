import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPencilAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Box, Button, TableContainer, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Popover, Typography } from '@material-ui/core';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { deleteHead } from '../../../store/actions/accountActions';
import { accountHeadTypes } from '../../../utils/constants';

function AccountTransactions({ storeId, heads, deleteHead }) {
 
  return(
    <>
      <Box width="100%" justifyContent="flex-end" display="flex" mb={2}>
        <Button startIcon={ <FontAwesomeIcon icon={faPlus} /> } variant="contained" color="primary" disableElevation component={Link} to="/accounts/transactions/new" >New Transaction</Button>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {
              heads.map(item => <Head {...{item, storeId, deleteHead}} key={item._id}  /> )
            }
          </TableBody>
        </Table>
      </TableContainer>
      </>
  )
}

const headTypesMaps = {
  [accountHeadTypes.ACCOUNT_HEAD_TYPE_GENERAL]: "General",
  [accountHeadTypes.ACCOUNT_HEAD_TYPE_INCOME]: "Income",
  [accountHeadTypes.ACCOUNT_HEAD_TYPE_EXPENSE]: "Expense",
}

function Head({ item, storeId, deleteHead }){
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
    <TableRow>
      <TableCell>{item.name}</TableCell>
      <TableCell>{ headTypesMaps[item.type] }</TableCell>
      
      <TableCell align="right">
        {
          !item.editAble ? null : 
          <>
            <IconButton component={Link} to={ '/accounts/heads/edit/' + storeId + '/' + item._id }  style={{ fontSize: '1.3rem' }} title="Edit Account Head">
              <FontAwesomeIcon icon={faPencilAlt} size="xs" />
            </IconButton>
            <IconButton onClick={(event) => handleClick(event) } style={{ fontSize: '1.3rem' }} title="Delete Account Head">
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
          vertical: 'top',
          horizontal: 'center',
        }}
        >
        <Box py={2} px={4} textAlign="center">
          <Typography gutterBottom>Do you want to delete <b>{item.name}</b> account head from store?</Typography>
          <Button disableElevation variant="contained" color="primary"  onClick={() => deleteHead(storeId, item._id)}>
            Delete Account Head
          </Button>
        </Box>
      </Popover>
  </>
  )
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  return {
    heads: state.accounts.heads[storeId] ? state.accounts.heads[storeId] : [],
    storeId
  }
}


export default connect(mapStateToProps, { deleteHead })(AccountTransactions);