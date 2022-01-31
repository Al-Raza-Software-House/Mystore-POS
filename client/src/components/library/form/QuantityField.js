import React from 'react';
import { TextField, Box, FormHelperText } from '@material-ui/core';


const QuantityField = ({
  label, input, addNewRecord=false, showError=true, ignoreTouch=false,
  meta: { touched, invalid, error },
  ...custom
}) => {
  return (
    <Box width="100%">
      <TextField
        {...input}
        {...custom}
      />
      {
        (ignoreTouch || touched) && error ?
        <FormHelperText error={ (ignoreTouch || touched) && invalid }>
             <span>{ (ignoreTouch || touched) && error }</span>          
        </FormHelperText>
        : null
      }
    </Box>
  );
}
 
export default QuantityField;