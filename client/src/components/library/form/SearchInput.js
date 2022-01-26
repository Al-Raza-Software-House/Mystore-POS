import { useRef } from 'react';
import _ from "lodash";
import { Box, TextField } from '@material-ui/core';
import React, { useEffect } from 'react';

const SearchInput = ({
  label, addNewRecord=false, showError=true, ignoreTouch=false,
  input: { onChange, value,  ...restInput },
  ...custom
}) => {
  const handleQueryChange = _.debounce((event) => {
    onChange(event.target.value);
  }, 300);
  const inputRef = useRef();
  useEffect(() => {
    inputRef.current.value = value;
  }, [value]);
  
  return (
    <Box width="100%">
      <TextField 
        label={label}
        inputRef={inputRef}
        onChange={handleQueryChange}
        {...restInput}
        {...custom}
      />
    </Box>
  );
}

export default SearchInput;