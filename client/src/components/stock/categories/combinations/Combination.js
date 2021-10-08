import React, { useState } from 'react';
import { ListItem, ListItemText, ListItemSecondaryAction, IconButton, makeStyles, Box, Typography, Button, Popover } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import EditCombination from './EditCombination';
import { deleteCombination } from '../../../../store/actions/categoryActions';
import { connect } from 'react-redux';

const useStyles = makeStyles(theme => ({
  listItem:{
    borderBottom: '2px solid rgba(0,0,0, 0.2)',
    textAlign: 'center',
    paddingRight: theme.spacing(2)
  }
}))

function Size({ combination, storeId, categoryId, deleteCombination}) {
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
    <ListItem key={combination._id} className={classes.listItem}>
      <ListItemText primary={combination.title} secondary={combination.code} />
      <ListItemSecondaryAction>
        <EditCombination {...{ combination, storeId, categoryId }} />
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
          <Typography gutterBottom>Do you want to delete <b>{combination.title}</b> from this list?</Typography>
          <Button disableElevation variant="contained" color="primary"  onClick={() => deleteCombination(storeId, categoryId, combination._id) }>
            Delete Color
          </Button>
        </Box>
      </Popover>

    </>
  )
}

export default connect(null, { deleteCombination })(Size);