import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPencilAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Box, Button, TableContainer, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Popover, Typography } from '@material-ui/core';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { deleteAdjustmentReason } from '../../../store/actions/adjustmentReasonActions';

function AdjustmentReasons({ storeId, reasons, deleteAdjustmentReason }) {
 
  return(
    <>
    {
      reasons.length === 0 ?
      <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
        <Typography gutterBottom>Adjustment reasons are used to adjust the stock of items when adjustment is not related sale, purchase or returns </Typography>
        <Button startIcon={ <FontAwesomeIcon icon={faPlus} /> } variant="contained" color="primary" disableElevation component={Link} to="/stock/adjustmentReasons/create" >Create New Reason</Button>
      </Box>
      :
      <>
      <Box width="100%" justifyContent="flex-end" display="flex" mb={2}>
        <Button startIcon={ <FontAwesomeIcon icon={faPlus} /> } variant="contained" color="primary" disableElevation component={Link} to="/stock/adjustmentReasons/create" >New Reason</Button>
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
              reasons.map(item => <Reason {...{item, storeId, deleteAdjustmentReason}} key={item._id}  /> )
            }
          </TableBody>
        </Table>
      </TableContainer>
      </>
    }
    </>
  )
}

function Reason({ item, storeId, deleteAdjustmentReason }){
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
        {
          item.default ? null :
          <>
            <IconButton component={Link} to={ '/stock/adjustmentReasons/edit/' + storeId + '/' + item._id }  style={{ fontSize: '1.3rem' }} title="Edit Reason">
              <FontAwesomeIcon icon={faPencilAlt} size="xs" />
            </IconButton>
            <IconButton onClick={(event) => handleClick(event) } style={{ fontSize: '1.3rem' }} title="Delete Reason">
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
          <Typography gutterBottom>Do you want to delete <b>{item.name}</b> reason from store?</Typography>
          <Button disableElevation variant="contained" color="primary"  onClick={() => deleteAdjustmentReason(storeId, item._id)}>
            Delete Reason
          </Button>
        </Box>
      </Popover>
  </>
  )
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  return {
    reasons: state.adjustmentReasons[storeId] ? state.adjustmentReasons[storeId] : [],
    storeId
  }
}


export default connect(mapStateToProps, { deleteAdjustmentReason })(AdjustmentReasons);