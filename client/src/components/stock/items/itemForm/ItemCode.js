import React, { useState, useEffect } from 'react';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, makeStyles } from '@material-ui/core';
import { connect } from 'react-redux';
import { change, Field } from 'redux-form';
import TextInput from '../../../library/form/TextInput';
import axios from 'axios';
import { showError } from '../../../../store/actions/alertActions';
import { hideProgressBar, showProgressBar } from '../../../../store/actions/progressActions';

const useStyles = makeStyles(theme => ({
  startIcon: {
    marginRight: 0
  },
  actionButton:{
    marginTop: 8,
    marginBottom: 4, 
    paddingLeft: 0, 
    paddingRight: 0, 
    width: 40,
    height: 40,
    minWidth: 40,
    borderLeft: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0
  }
}))

function ItemCode(props) {
  const classes = useStyles();
  const { storeId, categoryId, formName, addNewRecord=true, dispatch } = props;
  const [itemCodes, setItemCodes] = useState({});

  useEffect(() => {
    if(categoryId)
    {
      dispatch( change(formName, 'itemCode', itemCodes[categoryId] ? itemCodes[categoryId] : '') );
    }else
    {
      dispatch( change(formName, 'itemCode', '') );
    }
  }, [categoryId, dispatch, formName, itemCodes]);

  const generateItemCode = () => {
    if(itemCodes[categoryId])
     return dispatch( change(formName, 'itemCode', itemCodes[categoryId]) );
    dispatch( showProgressBar() );
    axios.post('/api/categories/createItemCode', {storeId, categoryId}).then( response => {
      dispatch( hideProgressBar() );
      if(response.data.itemCode)
      {
        setItemCodes({
          ...itemCodes,
          [categoryId]: response.data.itemCode
        });
      }
    }).catch(err => {
      dispatch( hideProgressBar() );
      dispatch( showError( err.response && err.response.data.message ? err.response.data.message: err.message ) );
    });
  }

  return(
    <>
    <Box display="flex">
      <Field
        component={TextInput}
        label="Item Code"
        name="itemCode"
        placeholder="Enter item code..."
        fullWidth={true}
        disabled={!categoryId}
        variant="outlined"
        margin="dense"
        style={{ flexGrow: 1 }}
        addNewRecord={addNewRecord}
        onKeyPress={event => {if(event.key === "Enter") event.preventDefault()}}
      />
      { 
        
        addNewRecord && 
        <Button 
          onClick={generateItemCode}
          disabled={!categoryId}
          title="Create item code"
          type="button"
          classes={{ root: classes.actionButton, startIcon: classes.startIcon }}
          disableElevation  startIcon={ <FontAwesomeIcon icon={faPlus} size="xs" /> } size="small" edge="end" variant="outlined">
        </Button>
      }
    </Box>
    
    </>
  )
}

const mapStateToProps = state => {
  return {
    storeId: state.stores.selectedStoreId
  }
}

export default connect(mapStateToProps)(ItemCode);




