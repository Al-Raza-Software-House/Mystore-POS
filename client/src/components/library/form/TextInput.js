import React from 'react';
import { TextField, makeStyles, Box, FormHelperText } from '@material-ui/core';
import clsx from 'clsx';

const useStyles = makeStyles(theme => ({
  inputNoBorder:{
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  }
}));

const TextInput = ({
  label, input, addNewRecord=false, showError=true,
  meta: { touched, invalid, error },
  ...custom
}) => {
  const classes = useStyles();
  return (
    <Box width="100%">
      <TextField 
        label={label}
        InputProps={{
          classes:{
            root: clsx({
              [classes.inputNoBorder]: addNewRecord === true
            })
          },
        }
        }
        {...input}
        {...custom}
      />
      {
        showError ? 
        <FormHelperText error={ touched && invalid }>
          {
            touched && error ? <span>{ touched && error }</span> : <span>&nbsp;</span>
          }
          
        </FormHelperText>
        : null
      }
    </Box>
  );
}
 
export default TextInput;