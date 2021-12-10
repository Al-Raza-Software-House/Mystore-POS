
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
  if(!((e.keyCode > 95 && e.keyCode < 106)
    || (e.keyCode > 47 && e.keyCode < 58) 
    || e.keyCode === 8 || e.keyCode === 9 || e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 110 || e.keyCode === 190 )) {
      e.preventDefault();
      return false;
  }
}