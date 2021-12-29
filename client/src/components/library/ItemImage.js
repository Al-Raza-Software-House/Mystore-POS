import React, { useState } from 'react';
import { Box, Dialog, DialogContent, DialogActions, Button, IconButton, makeStyles } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage } from '@fortawesome/free-solid-svg-icons';

const useStyles = makeStyles(theme => ({
  btn:{
    "&:hover":{
      boxShadow: "0px 0px 3px 1px rgba(33, 150, 243, 0.98)"
    }
  },
  icon:{
    "&:hover":{
      boxShadow: "0px 0px 5px 3px rgba(33, 150, 243, 0.98)"
    }
  }
}))

function ItemImage({ item, showButton=true }) {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  if(!item.image) return null;
  const handleClose = () => setOpen(false);
  return(
    <>
    {
      showButton ? 
      <IconButton className={classes.btn} onClick={(event) => { event.stopPropagation(); setOpen(true); }}>
        <FontAwesomeIcon icon={faImage} size="xs" />
      </IconButton>
      :
      <FontAwesomeIcon className={classes.icon} onClick={(event) => { event.stopPropagation(); setOpen(true); }} icon={faImage} size="sm" />
    }
    <Dialog  maxWidth="md"  open={open} onClose={handleClose} aria-labelledby="form-dialog-title" onClick={(event) => { event.stopPropagation(); }}>
        <DialogContent>
          <Box display="flex" alignItems="center" justifyContent="center" >
            <img src={ process.env.REACT_APP_STORAGE_BASE_URL + item.storeId+ '/items/' + item.image }  alt={item._id}/>
          </Box>
        </DialogContent>
        <DialogActions style={{ justifyContent: 'center' }}>
          <Button disableElevation onClick={(event) => { event.stopPropagation(); handleClose(); }} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ItemImage;