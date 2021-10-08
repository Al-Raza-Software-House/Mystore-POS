import React, { useState } from 'react';
import TextInput from './TextInput';
import { Field } from 'redux-form';
import { InputAdornment, IconButton } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const PasswordField = (props) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <Field 
      component={TextInput}
      name="password"
      label="Password"
      type={ showPassword ? 'text' : 'password' }
      fullWidth={true}
      variant={props.variant ? props.variant : "outlined"}
      ref={props.ref}
      InputProps={{
      endAdornment:
        <InputAdornment position="end">
          <IconButton
            aria-label="toggle password visibility"
            onClick={() => setShowPassword(!showPassword)}
            onMouseDown={(event) => event.preventDefault()}
          >
            <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash } size="xs" />
          </IconButton>
        </InputAdornment>
      }
    }
    {...props}
    />
  );
}
 
export default PasswordField;