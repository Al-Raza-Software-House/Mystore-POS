import { userTypes } from "./constants";

//Format multiValue autoComplete value coming from store
export const automCompleteFormat = (storeValue) => {
  if(!storeValue) return [null]; //Doesn't matter by default selected
  return storeValue;
}
//Normalize multiValue autoComplete value going to store
export const automCompleteNormalize = (inputValue) => {
  if(!inputValue)
    return null;
  if(inputValue && inputValue.length && inputValue.includes(null))
    return null; //save null in db for doesn't matter
  return inputValue; //save array in db for selected options
}

export const isSmallScreen = (screenWidth) => {
  const smallScreens = ['xs', 'sm'];
  return smallScreens.includes(screenWidth)
}

export const allowOnlyPostiveNumber = (e) => {
  if(e.ctrlKey)
  {
    if( [67, 86, 65, 88, 90, 89].indexOf(e.keyCode) === -1 ){ //select all, copy, past, do, undo
      e.preventDefault();
      return false;
    }else return;
  }
  let allowedKeys = [8, 9, 35, 36, 38, 40, 110, 190, 37, 39, 46];
  if(!((e.keyCode > 95 && e.keyCode < 106)
    || (e.keyCode > 47 && e.keyCode < 58) 
    || allowedKeys.indexOf(e.keyCode) !== -1 )) {
      e.preventDefault();
      return false;
  }
}

export const allowOnlyNumber = (e) => {
  if(e.ctrlKey)
  {
    if( [67, 86, 65, 88, 90, 89].indexOf(e.keyCode) === -1 ){ //select all, copy, past, do, undo
      e.preventDefault();
      return false;
    }else return;
  }
  let allowedKeys = [8, 9, 35, 36, 38, 40, 110, 190, 37, 39, 46, 189, 109];
  if(!((e.keyCode > 95 && e.keyCode < 106)
    || (e.keyCode > 47 && e.keyCode < 58) 
    || allowedKeys.indexOf(e.keyCode) !== -1 )) {
      e.preventDefault();
      return false;
  }
}

export const isOwner = (role) => {
  return role === userTypes.USER_ROLE_OWNER
}

export const isManager = (role) => {
  return role === userTypes.USER_ROLE_MANAGER;
}

export const isSalesperson = (role) => {
  return role === userTypes.USER_ROLE_SALESPERSON;
}