import React, { useEffect } from 'react';
import { makeStyles, Button, Box, Typography, FormHelperText } from '@material-ui/core'
import { Field, reduxForm, SubmissionError } from 'redux-form';
import axios from 'axios';
import TextInput from '../../library/form/TextInput';
import RadioInput from '../../library/form/RadioInput';
import { showProgressBar, hideProgressBar } from '../../../store/actions/progressActions';
import { categoryTypes } from '../../../utils/constants';
import { connect } from 'react-redux';
import { showSuccess } from '../../../store/actions/alertActions';
import { createCategory } from '../../../store/actions/categoryActions';
import { compose } from 'redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLongArrowAltLeft } from '@fortawesome/free-solid-svg-icons';
import { Link, useHistory } from 'react-router-dom';

let categoryTypeOptions = [
  { id: categoryTypes.CATEGORY_TYPE_STANDARD, title: "Standard" },
  { id: categoryTypes.CATEGORY_TYPE_VARIANT, title: "Variant(Size and Color)" },
]

const useStyles = makeStyles(theme => ({
  box: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 'auto'
  },
  progress: {
    marginLeft: theme.spacing(1)
  },
  formError: {
    textAlign: "center"
  }
}));

function CreateCategory(props) {
  const history = useHistory();
  const classes = useStyles();
  const { handleSubmit, pristine, submitSucceeded, submitting, error, invalid, dirty } = props;
  useEffect(() => {
    if(submitSucceeded)
      history.push('/stock/categories');
  }, [submitSucceeded, history])
    return(
      <>
      <Box width="100%" justifyContent="flex-end" display="flex">
        <Button disableElevation color="primary" startIcon={<FontAwesomeIcon icon={faLongArrowAltLeft} />} component={Link} to="/stock/categories">
          Categories
        </Button>
      </Box>
      <Box margin="auto" width={{ xs: '100%', md: '50%' }}>
        <Typography gutterBottom variant="h6" align="center">Add New Category</Typography>
        <form onSubmit={handleSubmit}>
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

          <Box>
            <Field
              component={TextInput}
              id="notes"
              name="notes"
              label="Notes"
              placeholder="Description or notes..."
              type="text"
              fullWidth={true}
              variant="outlined"
              multiline
              rows={3}
            />
          </Box>
          
        <Box textAlign="center">
          <Button disableElevation type="submit" variant="contained" color="primary" disabled={pristine || submitting || invalid || !dirty} >
            Add Category
          </Button>
          {  
            <FormHelperText className={classes.formError} error={true} style={{visibility: !submitting && error ? 'visible' : 'hidden' }}>
              <Typography component="span">{ error ? error : 'invalid request' }</Typography>
            </FormHelperText>  
          }
        </Box>
        </form>
      </Box>
      </>
    )
}

const onSubmit = (values, dispatch, { storeId }) => {
  dispatch(showProgressBar());
  return axios.post('/api/categories/create', {storeId, ...values}).then( response => {
    dispatch(hideProgressBar());
    if(response.data._id)
    {
      dispatch( createCategory(storeId, response.data) );
      dispatch( showSuccess("New category added") );
    }

  }).catch(err => {
    dispatch(hideProgressBar());
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

const mapStateToProps = state => {
  return{
    storeId: state.stores.selectedStoreId
  }
}

export default compose(
connect(mapStateToProps),
reduxForm({
  'form': 'createCategory',
  validate,
  onSubmit,
  initialValues: { type: categoryTypes.CATEGORY_TYPE_STANDARD }
})
)(CreateCategory);