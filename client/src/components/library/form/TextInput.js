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
  label, input, addNewRecord=false, showError=true, ignoreTouch=false,
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
        <FormHelperText error={ (ignoreTouch || touched) && invalid }>
          {
            (ignoreTouch || touched) && error ? <span>{ (ignoreTouch || touched) && error }</span> : <span>&nbsp;</span>
          }
          
        </FormHelperText>
        : null
      }
    </Box>
  );
}
 
export default TextInput;