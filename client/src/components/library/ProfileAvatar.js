import React from 'react';
import { connect } from 'react-redux';
import { Avatar } from '@material-ui/core';
import MaleAvatar from '../../assets/images/male-avatar.jpg';

const ProfileAvatar = ({profilePicture, size=40 }) => {
  let src = null;
  if(profilePicture)
    src = process.env.REACT_APP_STORAGE_BASE_URL + 'users/' + profilePicture;
  else
    src = MaleAvatar;
  return (
    <Avatar style={{ width: size, height: size }} alt="Profile Pic" src={src} />
  );
}
 
const mapStateToProps = (state) => {
  return{
    profilePicture: state.auth.account ? state.auth.account.profilePicture : ""
  }
}

export default  connect(mapStateToProps)(ProfileAvatar);