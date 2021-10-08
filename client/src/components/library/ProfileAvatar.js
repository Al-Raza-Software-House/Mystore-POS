import React from 'react';
import { connect } from 'react-redux';
import { Avatar } from '@material-ui/core';
import MaleAvatar from '../../assets/images/male-avatar.jpg';
import FemaleAvatar from '../../assets/images/female-avatar.jpg';

const ProfileAvatar = ({profilePic, gender, size=40 }) => {
  let src = null;
  if(profilePic)
    src = profilePic.thumbUrl ? profilePic.thumbUrl : profilePic.imageUrl;
  else if(gender === 1)
    src = MaleAvatar;
  else if(gender === 2)
    src = FemaleAvatar;
  return (
    <Avatar style={{ width: size, height: size }} alt="Profile Pic" src={src} />
  );
}
 
const mapStateToProps = (state) => {
  const componentState = {
    gender: state.profile && state.profile.basicInfo && state.profile.basicInfo.gender ? state.profile.basicInfo.gender : 1
  }
  const images = state.profile && state.profile.photos && state.profile.photos.images && state.profile.photos.images.length ? 
                 state.profile.photos.images : [];
  
  if(images.length)
  {
    let ProfilePicIndex = state.profile.photos.profilePictureIndex ? state.profile.photos.profilePictureIndex : 0;
    componentState.profilePic = images[ProfilePicIndex] ? images[ProfilePicIndex] : images[0];
  }else
  {
    componentState.profilePic = null;
  }
  return componentState
}

export default  connect(mapStateToProps)(ProfileAvatar);