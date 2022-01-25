import React, { useState, useCallback, useMemo } from 'react';
import { Menu, MenuItem, IconButton } from '@material-ui/core';
import { Link as RouterLink } from 'react-router-dom';
import { connect } from 'react-redux';
import { logOut } from '../../store/actions/authActions';
import ProfileAvatar from '../library/ProfileAvatar';


const AccountMenu = ({ logOut }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleProfileMenuOpen = useCallback(event => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const menuId = 'app-navbar-account-menu';
  const renderMenu = useMemo(() => (
    <Menu
      anchorEl={anchorEl}
      id={menuId}
      keepMounted
      open={isMenuOpen}
      onClose={handleMenuClose}
      getContentAnchorEl={null}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <MenuItem to="/account-settings" component={RouterLink}onClick={handleMenuClose}>Account Settings</MenuItem>
      <MenuItem onClick={() => logOut()}>Logout</MenuItem>
    </Menu>
  ),  [anchorEl, handleMenuClose, isMenuOpen, logOut]);
  return (
    <>
      <IconButton
        edge="end"
        aria-label="account of current user"
        aria-controls={menuId}
        aria-haspopup="true"
        onClick={handleProfileMenuOpen}
        color="inherit"
      >
        <ProfileAvatar />
      </IconButton>
      {renderMenu}
    </>
  );
}

export default  React.memo(connect(null, {logOut})(AccountMenu));