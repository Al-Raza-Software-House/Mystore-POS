import React, { useState } from 'react';
import { ListItem, ListItemText, ListItemSecondaryAction, IconButton, makeStyles, Box, Typography, Button, Popover } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import EditSize from './EditSize';
import { deleteSize } from '../../../../store/actions/categoryActions';
import { connect } from 'react-redux';

const useStyles = makeStyles(theme => ({
  listItem:{
    borderBottom: '2px solid rgba(0,0,0, 0.2)',
    textAlign: 'center',
    paddingRight: theme.spacing(2)
  }
}))

function Size({ size, storeId, categoryId, deleteSize}) {
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
    <ListItem key={size._id} className={classes.listItem}>
      <ListItemText primary={size.title} secondary={size.code} />
      <ListItemSecondaryAction>
        <EditSize {...{ size, storeId, categoryId }} />
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
          <Typography gutterBottom>Do you want to delete <b>{size.title}</b> from this list?</Typography>
          <Button disableElevation variant="contained" color="primary"  onClick={() => deleteSize(storeId, categoryId, size._id) }>
            Delete Size
          </Button>
        </Box>
      </Popover>

    </>
  )
}

export default connect(null, { deleteSize })(Size);