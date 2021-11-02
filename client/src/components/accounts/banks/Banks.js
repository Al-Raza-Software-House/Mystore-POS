import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPencilAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Box, Button, TableContainer, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Popover, Typography } from '@material-ui/core';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { deleteBank } from '../../../store/actions/accountActions';

function Banks({ storeId, banks, deleteBank }) {
 
  return(
    <>
    {
      banks.length === 0 ?
      <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
        <Typography gutterBottom> You can receive or make payments through banks. {process.env.REACT_APP_NAME} will keep track of your bank transactions.   </Typography>
        <Button startIcon={ <FontAwesomeIcon icon={faPlus} /> } variant="contained" color="primary" disableElevation component={Link} to="/accounts/banks/create" >Add New Bank</Button>
      </Box>
      :
      <>
      <Box width="100%" justifyContent="flex-end" display="flex" mb={2}>
        <Button startIcon={ <FontAwesomeIcon icon={faPlus} /> } variant="contained" color="primary" disableElevation component={Link} to="/accounts/banks/create" >New Bank</Button>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {
              banks.map(item => <Bank {...{item, storeId, deleteBank}} key={item._id}  /> )
            }
          </TableBody>
        </Table>
      </TableContainer>
      </>
    }
    </>
  )
}

function Bank({ item, storeId, deleteBank }){
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
      
      <TableCell align="right">
        <IconButton component={Link} to={ '/accounts/banks/edit/' + storeId + '/' + item._id }  style={{ fontSize: '1.3rem' }} title="Edit Bank">
          <FontAwesomeIcon icon={faPencilAlt} size="xs" />
        </IconButton>
        <IconButton onClick={(event) => handleClick(event) } style={{ fontSize: '1.3rem' }} title="Delete Bank">
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
          vertical: 'top',
          horizontal: 'center',
        }}
        >
        <Box py={2} px={4} textAlign="center">
          <Typography gutterBottom>Do you want to delete <b>{item.name}</b> bank from store?</Typography>
          <Button disableElevation variant="contained" color="primary"  onClick={() => deleteBank(storeId, item._id)}>
            Delete Bank
          </Button>
        </Box>
      </Popover>
  </>
  )
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  return {
    banks: state.accounts.banks[storeId] ? state.accounts.banks[storeId] : [],
    storeId
  }
}


export default connect(mapStateToProps, { deleteBank })(Banks);