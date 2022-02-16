import React, { useRef, useState } from 'react';
import { Box, Button, CircularProgress, FormHelperText } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Compress from 'compress.js';

function resizeImageFile(file, imageWidth) {
  return new Promise(async resolve => { 
    const compress = new Compress();
    const resizedImage = await compress.compress([file], {
      size: 0.5, // the max size in MB, defaults to 2MB
      quality: 0.8, // the quality of the image, max is 1,
      maxWidth: imageWidth ? imageWidth : process.env.REACT_APP_RESIZE_IMAGE_WIDTH, // the max width of the output image, defaults to 1920px
      resize: true // defaults to true, set false if you do not want to resize the image width and height
    });
    const imgData = resizedImage[0];

    let resizedFile = Compress.convertBase64ToFile(imgData.data, 'image/png');
    resolve({
      file: resizedFile,
      base64: imgData.prefix + imgData.data
    });
  });
}

function readImageFile(file) {
  return new Promise(async resolve => { 
    const reader = new FileReader();

    reader.onload = function (e) {
      resolve({
        file: file,
        base64: e.target.result
      });
    }
    reader.readAsDataURL(file);
  });
}

function UploadFile(props) {
  const {
    label, filePath, disabled=false, imageWidth=false, storeId=null, resize=true,
    input: { value, onChange }
  } = props;
  
  const fileInput = useRef();
  const [msg, setMsg] = useState();
  const [base64, setBase64] = useState(null);
  const [inProgress, setInProgress] = useState(false);

  const imageUrl = process.env.REACT_APP_STORAGE_BASE_URL + ( storeId ? storeId + '/' : ''  ) + filePath + value;

  const  handleFiles = async () => {
    const files = fileInput.current.files;
    if(files.length === 0){
      onChange("");
      return setMsg("");
    }

    
    setMsg('Uploading...');
    let { file, base64 } = resize ? await resizeImageFile(files[0], imageWidth) : await readImageFile(files[0]);
    setBase64(base64);
    let fileName = Math.random().toString(36).substring(2) + '.png'; 
    setInProgress(true);
    axios.post('/api/services/createPhotoUploadUrl', {storeId, filePath, file: fileName, type: file.type}).then(({ data }) => {
      
      axios.put(data.putUrl, file, {
          headers: {
            'content-type': file.type
          }
        }).then(res => {
          setMsg("uploaded");
          onChange(fileName);
          setInProgress(false);
        }).catch(err => {
          setMsg(err.message);
          setInProgress(false);
        })
      
    }).catch(err => {
      setInProgress(false);
      setMsg(err.response && err.response.data ? err.response.data.message : err.message);
    });
  };

  return(
    <Box width="100%" mt={1} display="flex" justifyContent="space-between">
      <Box width="55%">
        <Button onClick={() => fileInput.current.click()} disabled={disabled} variant="outlined" color="primary" startIcon={ <FontAwesomeIcon icon={faUpload} /> }>
          { inProgress ? <CircularProgress size={20} /> : label }
        </Button>
        <input style={{visibility: 'hidden'}} type="file" onChange={handleFiles} ref={fileInput} accept="image/*"  />
        <FormHelperText> { msg ? <span>{ msg }</span> : <span>&nbsp;</span> } </FormHelperText>
      </Box>
      <Box width="45%">
        { 
          value || base64 ? 
          <img src={base64 ? base64 : imageUrl} style={{ width: '100%'}} alt={value} />
          : null
        }
      </Box>
    </Box>
  )
}

export default UploadFile;