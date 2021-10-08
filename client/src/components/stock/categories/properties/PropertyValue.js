import React, { useState } from 'react';
import { ListItem, ListItemText, ListItemSecondaryAction, IconButton, makeStyles, Box, Typography, Button, Popover } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import EditPropertyValue from './EditPropertyValue';
import { deletePropertyValue } from '../../../../store/actions/categoryActions';
import { connect } from 'react-redux';

const useStyles = makeStyles(theme => ({
  listItem:{
    borderBottom: '2px solid rgba(0,0,0, 0.2)',
    textAlign: 'center',
    paddingRight: theme.spacing(2)
  }
}))

function PropertyValue({ value, storeId, categoryId, propertyId, propertyName,  deletePropertyValue}) {
  const classes = useStyles();
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
    <ListItem className={classes.listItem}>
      <ListItemText primary={value.title} />
      <ListItemSecondaryAction>
        <EditPropertyValue {...{ value, storeId, categoryId, propertyId, propertyName }} />
        <IconButton edge="end" style={{ fontSize: 18 }} onClick={(event) => handleClick(event) }>
          <FontAwesomeIcon icon={faTrash} size="sm" />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>

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
          <Typography gutterBottom>Do you want to delete <b>{value.title}</b> from this list?</Typography>
          <Button disableElevation variant="contained" color="primary"  onClick={() => deletePropertyValue(storeId, categoryId, propertyId, value._id) }>
            Delete
          </Button>
        </Box>
      </Popover>

    </>
  )
}

export default connect(null, { deletePropertyValue })(PropertyValue);