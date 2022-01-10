import React, { useState, useEffect } from 'react';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, CircularProgress, makeStyles, Dialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core';
import { connect } from 'react-redux';
import { change, Field, initialize, reduxForm, SubmissionError } from 'redux-form';
import { categoryTypes } from '../../../../utils/constants';
import TextInput from '../../../library/form/TextInput';
import AutoComplete from '../../../library/form/AutoComplete';
import RadioInput from '../../../library/form/RadioInput';
import FormMessage from '../../../library/FormMessage';
import axios from 'axios';
import { showSuccess } from '../../../../store/actions/alertActions';
import { createCategory } from '../../../../store/actions/categoryActions';

function SelectCategory(props) {
  const { storeId, formName, categories, addNewRecord=true, disabled=false } = props;
  return(
    <>
    <Box display="flex">
      <Field
        component={AutoComplete}
        options={categories}
        getOptionLabel={(option) => option && option.name ? option.name : ""}
        label="Select Category"
        id="category-id"
        name="categoryId"
        placeholder="Select a category"
        fullWidth={true}
        style={{ flexGrow: 1 }}
        addNewRecord={addNewRecord}
        disabled={disabled}
      />
      { addNewRecord && <AddCategoryForm storeId={storeId} formName={formName} /> }
    </Box>
    
    </>
  )
}

const mapStateToProps = state => {
  return {
    storeId: state.stores.selectedStoreId,
    categories: state.categories[state.stores.selectedStoreId] ? state.categories[state.stores.selectedStoreId] : []
  }
}

export default connect(mapStateToProps)(SelectCategory);

let categoryTypeOptions = [
  { id: categoryTypes.CATEGORY_TYPE_STANDARD, title: "Standard" },
  { id: categoryTypes.CATEGORY_TYPE_VARIANT, title: "Variant(Size and Color)" },
]

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

function AddCategory(props){
  const { handleSubmit, pristine, dispatch, submitSucceeded, submitting, error, invalid } = props;
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
      dispatch( initialize('createCategory', { type: categoryTypes.CATEGORY_TYPE_STANDARD }) );
      setOpen(false);
    }
  }, [submitSucceeded, dispatch])

  return(
    <>
    <Button 
      type="button"
      title="Add new category"
      onClick={() => setOpen(true)}
      classes={{ root: classes.actionButton, startIcon: classes.startIcon }}
      disableElevation  startIcon={ <FontAwesomeIcon icon={faPlus} size="xs" /> } size="small" edge="end" variant="outlined">
    </Button>
    <Dialog open={open} fullWidth onClose={handleClose} aria-labelledby="form-dialog-title">
      <DialogTitle style={{ textAlign: 'center' }}>Add New Category</DialogTitle>
      <form onSubmit={submitForm}>
        <DialogContent>
          <Box mb={2}>
            <Field
              component={RadioInput}
              options={categoryTypeOptions}
              label="Category Type"
              id="type"
              name="type"
            />
          </Box>
          <Box>
            <Field
            component={TextInput}
            id="name"
            name="name"
            label="Category Name"
            placeholder="Category name..."
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

const onSubmit = (values, dispatch, { storeId, formName }) => {
  return axios.post('/api/categories/create', {storeId, ...values}).then( response => {
    if(response.data.category._id)
    {
      dispatch( createCategory(storeId, response.data.category, response.data.now, response.data.lastAction) );
      dispatch( change(formName, 'categoryId', response.data.category._id) );
      dispatch( showSuccess("New category created") );
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
  if(!values.type)
    errors.type = "Category type is required";
  if(!values.name)
   errors.name = "Category name is required";
  return errors;
}


const AddCategoryForm = reduxForm({
  'form': 'createCategory',
  validate,
  onSubmit,
  initialValues: { type: categoryTypes.CATEGORY_TYPE_STANDARD }
})(AddCategory);
