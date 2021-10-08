import React, { useMemo } from 'react';
import { Box, Typography } from '@material-ui/core';

const FormRow = ({ children, label }) => {
  const formStyles = useMemo(() => ({
    container: {
      display: "flex",
      flexWrap: "wrap"
    },
    label: {
      width: {xs: "100%" , sm: "20%"},
      mb: 1,
      alignSelf: "center"
    },
    control: {
      width: {xs: "100%" , sm: "80%"},
      mb: 2
    }
  }), []);
  return (
    <Box {...formStyles.container}>
        <Box {...formStyles.label}> <Typography> {label} </Typography> </Box>
        <Box {...formStyles.control}>
          {children}
        </Box>
    </Box>
  );
}
 
export default FormRow;