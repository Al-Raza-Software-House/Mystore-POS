import React from 'react';

import { FormHelperText, Typography } from "@material-ui/core";

const FormMessage = ({ children, error, success, textLeft, style }) => {
  const styleProps = {
    textAlign: textLeft ? "left" : "center",
    ...style
  }
  if(error)
    styleProps.color = 'red';
  else if(success)
    styleProps.color = 'green';
  return (
    <FormHelperText style={styleProps} component="div">
      <Typography component="div"> { children } </Typography>
    </FormHelperText>
  );
}
 
export default FormMessage;