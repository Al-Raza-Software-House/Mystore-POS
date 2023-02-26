
import React, { useState } from 'react';
import { Button,  Box, Popover } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import ItemsGrid from './ItemsGrid';

function Favorites({ disableEdit, selectItem }){
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
    <Box display="flex" justifyContent="center" width="100%">
    <Button onClick={(event) => handleClick(event) } variant="outlined" color="primary" endIcon={<FontAwesomeIcon icon={faCaretDown} size="xs" />}>
      Favorite Items
    </Button>
    <Popover 
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        >
        <Box p={2} textAlign="center" style={{ backgroundColor: "#f9f9f9" }}>
          <ItemsGrid disabled={disableEdit} selectItem={selectItem} style={{ flexGrow: 1 }} />
        </Box>
      </Popover>
  </Box>
  )
}

export default Favorites;