import React, { useEffect } from 'react';
import { makeStyles, Button, Box, Typography, FormHelperText, FormLabel } from '@material-ui/core'
import { Field, initialize, reduxForm, SubmissionError } from 'redux-form';
import axios from 'axios';
import TextInput from '../../library/form/TextInput';
import { showProgressBar, hideProgressBar } from '../../../store/actions/progressActions';
import { categoryTypes } from '../../../utils/constants';
import { useSelector } from 'react-redux';
import { showError, showSuccess } from '../../../store/actions/alertActions';
import { updateCategory } from '../../../store/actions/categoryActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLongArrowAltLeft } from '@fortawesome/free-solid-svg-icons';
import { Link, Redirect, useHistory, useParams } from 'react-router-dom';
import ReactGA from "react-ga4";

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

function EditCategory(props) {
  const history = useHistory();
  const classes = useStyles();
  const { storeId, categoryId } = useParams();
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/stock/categories/edit", 'title' : "Edit Category" });
  }, []);

  const category = useSelector( state =>  state.categories[storeId].find(item => item._id === categoryId) );
  const { dispatch, handleSubmit, pristine, submitSucceeded, submitting, error, invalid, dirty } = props;

  useEffect(() => {
    if(!category) return;
    dispatch( initialize('editCategory', {
      type: category.type,
      name: category.name,
      notes: category.notes
    }) )
  }, [category, dispatch])
  useEffect(() => {
    if(submitSucceeded)
      history.push('/stock/categories');
  }, [submitSucceeded, history])

  if(!categoryId || !category)
  {
    dispatch( showError("Category not found") );
    return <Redirect to="/stock/categories" />
  }

    return(
      <>
      <Box width="100%" justifyContent="flex-end" display="flex">
        <Button disableElevation color="primary" startIcon={<FontAwesomeIcon icon={faLongArrowAltLeft} />} component={Link} to="/stock/categories">
          Categories
        </Button>
      </Box>
      <Box margin="auto" width={{ xs: '100%', md: '50%' }}>
        <Typography gutterBottom variant="h6" align="center">Update Category</Typography>
        <form onSubmit={handleSubmit}>
          <FormLabel style={{ display: 'block', marginBottom: '30px' }}>
            CategoryType: { category.type === categoryTypes.CATEGORY_TYPE_STANDARD ? "Standard" : "Variant(Size and Color)" }
          </FormLabel>
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
            Update Category
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

const onSubmit = (values, dispatch, props) => {
  const { match } = props;
  dispatch(showProgressBar());
  return axios.post('/api/categories/update', {...match.params, ...values}).then( response => {
    dispatch(hideProgressBar());
    if(response.data.category._id)
    {
      dispatch( updateCategory(match.params.storeId, match.params.categoryId, response.data.category, response.data.now, response.data.lastAction) );
      dispatch( showSuccess("Category updated") );
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

export default 
reduxForm({
  'form': 'editCategory',
  validate,
  onSubmit,
  initialValues: { type: categoryTypes.CATEGORY_TYPE_STANDARD }
})
(EditCategory);