import React, { useState, useEffect, useRef } from 'react';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, CircularProgress, makeStyles, Dialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { change, Field, initialize, reduxForm, SubmissionError } from 'redux-form';
import TextInput from '../../../library/form/TextInput';
import AutoComplete from '../../../library/form/AutoComplete';
import FormMessage from '../../../library/FormMessage';
import axios from 'axios';
import { showSuccess } from '../../../../store/actions/alertActions';
import { updateCategory } from '../../../../store/actions/categoryActions';

function SelectCategoryProperty(props) {
  const { formName, categoryId, propertyId, disabled=false, addNewRecord=true } = props;
  const { storeId, category } = useSelector(state => {
    let storeId = state.stores.selectedStoreId;
    const categories = state.categories[storeId] ? state.categories[storeId] : [];
    return {
      storeId,
      category: categories.find(item => item._id === categoryId)
    }
  })
  const lastCategory = useRef();

  const dispatch = useDispatch();
  
  useEffect(() => {
      if(lastCategory.current && lastCategory.current !== categoryId) //use Ref to prevent empty properties  on page load edit item, if category changes, empty properties
        dispatch( change(formName, `categoryPropertyValues.${propertyId}`, null ) );
      lastCategory.current = categoryId;
  }, [categoryId, dispatch, formName, propertyId]);

  return(
    <>
    <Box display="flex">
      <Field
        component={AutoComplete}
        options={category[propertyId].values}
        getOptionLabel={(option) => option && option.title ? option.title : ""}
        label={category[propertyId].name}
        id={propertyId}
        name={`categoryPropertyValues.${propertyId}`}
        placeholder={category[propertyId].name}
        fullWidth={true}
        style={{ flexGrow: 1 }}
        disabled={disabled}
        addNewRecord={addNewRecord}
      />
      { addNewRecord && <AddCategoryPropertyForm disabled={disabled} storeId={storeId} categoryId={categoryId} propertyId={propertyId} propertyName={category[propertyId].name} formName={formName} /> }
    </Box>
    
    </>
  )
}

export default SelectCategoryProperty;

const useStyles = makeStyles(theme => ({
  startIcon: {
    marginRight: 0
  },
  actionButton:{
    marginTop: 8,
    marginBottom: 4, 
    paddingLeft: 0, 
    paddingRight: 0, 
    minWidth: 40,
    width: 40,
    height: 40,
    borderLeft: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0
  }
}))

function AddCategoryProperty(props){
  const { handleSubmit, disabled, propertyName, pristine, dispatch, submitSucceeded, submitting, error, invalid } = props;
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const handleClose = () => setOpen(false);

  const submitForm = (event) => {
    event.stopPropagation();
    handleSubmit(event);
  }

  useEffect(() => {
    if(submitSucceeded)
    {
      dispatch( initialize('addCategoryProperty', {}) );
      setOpen(false);
    }
  }, [submitSucceeded, dispatch])

  return(
    <>
    <Button 
      type="button"
      disabled={disabled}
      title="Add new property value"
      onClick={() => setOpen(true)}
      classes={{ root: classes.actionButton, startIcon: classes.startIcon }}
      disableElevation  startIcon={ <FontAwesomeIcon icon={faPlus} size="xs" /> } size="small" edge="end" variant="outlined">
    </Button>
    <Dialog open={open} fullWidth onClose={handleClose} aria-labelledby="form-dialog-title">
      <DialogTitle style={{ textAlign: 'center' }}>Add New {propertyName}</DialogTitle>
      <form onSubmit={submitForm}>
        <DialogContent>
          <Box >
            <Field
            component={TextInput}
            name="title"
            label={propertyName}
            placeholder={propertyName}
            fullWidth={true}
            variant="outlined"
            autoFocus={true}
            />    
          </Box>

          <Box px={2} display="flex" justifyContent="center" alignItems="center">
            <Button disableElevation type="submit"  color="primary" variant="contained" disabled={pristine || submitting || invalid}>
              Add { submitting && <CircularProgress style={{ marginLeft: 8 }} size={24} /> }
            </Button>
          </Box>
          <Box px={2} display="flex" justifyContent="center" alignItems="center">
            <FormMessage error={true} style={{visibility: !submitting && error ? 'visible' : 'hidden' }}>
              { error ? error : 'invalid request' }
            </FormMessage>  
          </Box>
          
        </DialogContent>
      </form>
      <DialogActions style={{ justifyContent: 'center' }}>
        <Button disableElevation type="button" onClick={handleClose} color="primary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
    </>
  )
}

const onSubmit = (values, dispatch, { storeId, categoryId, propertyId, formName }) => {
  return axios.post('/api/categories/addPropertyValue', {storeId, categoryId, propertyId, ...values}).then( response => {
    if(response.data.category._id)
    {
      const values = response.data.category[propertyId].values;
      dispatch( updateCategory(storeId, categoryId, response.data.category, response.data.now, response.data.lastAction) );
      dispatch( change(formName, `categoryPropertyValues.${propertyId}`, values[values.length - 1]._id ) );
      dispatch( showSuccess("New property value added") );
    }

  }).catch(err => {
    throw new SubmissionError({
      _error: err.response && err.response.data.message ? err.response.data.message: err.message
    });
  });
}

const validate = (values, props) => {
  const { dirty } = props;
  if(!dirty) return {};
  const errors = {};
  if(!values.title)
   errors.title = "Value is required";
  return errors;
}


const AddCategoryPropertyForm = reduxForm({
  'form': 'addCategoryProperty',
  validate,
  onSubmit,
  initialValues: {}
})(AddCategoryProperty);
