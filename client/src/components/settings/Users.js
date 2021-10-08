import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Box, Chip, IconButton, Button, Table, TableBody, TableCell, TableHead, TableRow, Popover, Typography, TableContainer } from '@material-ui/core';
import { userTypes } from '../../utils/constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { removeUser } from '../../store/actions/storeActions';
import EditUser from './EditUser';
import { Link } from 'react-router-dom';

const rolesMap = {
  [userTypes.USER_ROLE_OWNER]: <Chip label="Owner" color="primary" />,
  [userTypes.USER_ROLE_MANAGER]: <Chip label="Manager" color="primary" variant="outlined" />,
  [userTypes.USER_ROLE_SALESPERSON]: <Chip label="Sales Person" />,
}

const Users = ({ uid, users, selectedStoreId, removeUser, userRole }) => {
  return (
    <>
    <Box width="100%" justifyContent="flex-end" display="flex">
      <Button disableElevation variant="contained" color="primary" startIcon={<FontAwesomeIcon icon={faPlus} />} component={Link} to="/store-settings/users/adduser">
        Add New User
      </Button>
    </Box>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Mobile Number</TableCell>
            <TableCell align="center">Role</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {
            users.map(item => <User item={item} key={item._id} uid={uid} myRole={userRole} removeUser={removeUser} storeId={selectedStoreId} /> )
          }
        </TableBody>
      </Table>
    </TableContainer>
    </>
  );
}

function User({ uid, item, myRole, storeId, removeUser }){
  const [anchorEl, setAnchorEl] = useState(null);
  const [action, setAction] = useState(null); //deleteing or editing
  const handleClick = (event, actionType) => {
    setAction(actionType);
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
      <TableCell>{item.record.name}</TableCell>
      <TableCell>{item.record.phone}</TableCell>
      <TableCell align="center">{rolesMap[item.userRole]}</TableCell>
      <TableCell align="center">
        { (uid === item.userId || item.isCreator || (myRole === userTypes.USER_ROLE_MANAGER && item.userRole === userTypes.USER_ROLE_OWNER) )  ? null :
          <IconButton onClick={(event) => handleClick(event, 'edit') } style={{  fontSize: '1.3rem' }} title="Edit Role">
            <FontAwesomeIcon icon={faPencilAlt} size="xs" />
          </IconButton>
        }
        {
          (uid === item.userId || item.isCreator || (myRole === userTypes.USER_ROLE_MANAGER && item.userRole === userTypes.USER_ROLE_OWNER) ) ? null :
          <IconButton onClick={(event) => handleClick(event, 'delete') } style={{ fontSize: '1.3rem' }} title="Remove User">
            <FontAwesomeIcon icon={faTrash} size="xs" />
          </IconButton>
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
        {
          action === 'delete' && 
          <Box py={2} px={4} textAlign="center">
            <Typography gutterBottom>Do you want to remove <b>{item.record.name}</b> from store?</Typography>
            <Button disableElevation variant="contained" color="primary"  onClick={() => removeUser(item.userId)}>
              Remove User
            </Button>
          </Box>
        }

        { action === 'edit' && <EditUser {...{ item, storeId, handleClose, myRole  }} /> }
      </Popover>
  </>
  )
}




const mapStateToProps = (state) => {
  const store = state.stores.stores.find(item => item._id === state.stores.selectedStoreId);
  return {
    uid: state.auth.uid,
    users: store.users,
    userRole: state.stores.userRole,//user Role for select store
    selectedStoreId: state.stores.selectedStoreId
  }
}
 
export default connect(mapStateToProps, { removeUser })(Users);