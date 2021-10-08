
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