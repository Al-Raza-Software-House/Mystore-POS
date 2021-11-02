import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { connect, useSelector, useDispatch } from 'react-redux';
import { useHistory, useParams, Link } from 'react-router-dom';
import { compose } from 'redux';
import { Button, Box, Typography, FormHelperText, InputAdornment, IconButton, Tooltip  } from '@material-ui/core'
import { change, Field, FieldArray, formValueSelector, initialize, reduxForm, SubmissionError } from 'redux-form';
import { showError, showSuccess } from '../../../store/actions/alertActions';
import { hideProgressBar, showProgressBar } from "../../../store/actions/progressActions";
import { updateItem } from "../../../store/actions/itemActions";
import { categoryTypes } from '../../../utils/constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faInfoCircle, faLongArrowAltLeft, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import SelectCategorySize from './itemForm/SelectCategorySize';
import SelectCategoryCombination from './itemForm/SelectCategoryCombination';
import SelectCategory from './itemForm/SelectCategory';
import TextInput from '../../library/form/TextInput';
import SelectSupplier from './itemForm/SelectSupplier';
import CheckboxInput from '../../library/form/CheckboxInput';
import SelectCategoryProperty from './itemForm/SelectCategoryProperty';
import SelectItemProperty from './itemForm/SelectItemProperty';
import UploadFile from '../../library/UploadFile';
import Panel from '../../library/Panel';

const formName = "editItem";
const formSelector = formValueSelector( formName );

function EditItem(props){
  const { showProgressBar, hideProgressBar, showError } = props;
  const { dispatch, handleSubmit, pristine, submitSucceeded, submitting, error, invalid } = props;
  const { categoryId, category, variants, costPrice, salePrice, minStock, maxStock } = props;

  const [submitPreloader, setSubmitPreloader] = React.useState(false);
  const [itemLoaded, setItemLoaded] = useState(null);
  const { storeId, itemId } = useParams();
  const history = useHistory();

  //load item from server on Component Mount
  useEffect(() => {
    showProgressBar();
    axios.get('/api/items/load', { params: { storeId, itemId } } ).then( ({ data }) => {
      hideProgressBar();
      dispatch( initialize(formName, data.item) );
      console.log(data.item);
      setItemLoaded(true);
    }).catch( err => {
      hideProgressBar();
      showError( err.response && err.response.data.message ? err.response.data.message: err.message );
      history.push('/stock');
    } );
  }, []);

  const submitForm = (e) => {
    e.preventDefault();
    setSubmitPreloader(true);
    dispatch(showProgressBar());
    handleSubmit();
  }

  const copyCostPrice = () => {
    variants.forEach((variant, index) => {
      dispatch( change(formName, `variants[${index}].costPrice`, costPrice) );
    });
  }
  const copySalePrice = () => {
    variants.forEach((variant, index) => {
      dispatch( change(formName, `variants[${index}].salePrice`, salePrice) );
    });
  }
  const copyMinStock = () => {
    variants.forEach((variant, index) => {
      dispatch( change(formName, `variants[${index}].minStock`, minStock) );
    });
  }
  const copyMaxStock = () => {
    variants.forEach((variant, index) => {
      dispatch( change(formName, `variants[${index}].maxStock`, maxStock) );
    });
  }

  useEffect(() => {
    if(submitSucceeded)
      history.push('/stock');
  }, [submitSucceeded, history])

  return(
    <>
    <Box width="100%" justifyContent="space-between" display="flex">
      <Typography gutterBottom variant="h6" style={{ flexGrow: 1 }} align="center">Update Item</Typography>
      <Button disableElevation color="primary" startIcon={<FontAwesomeIcon icon={faLongArrowAltLeft} />} component={Link} to="/stock">
        Items
      </Button>
    </Box>
    { itemLoaded &&
      <form onSubmit={submitForm}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
          <Box width={{ xs: '100%', md: '31%' }} >
            <SelectCategory formName={formName} addNewRecord={false} disabled={true} />
          </Box>
          <Box width={{ xs: '100%', md: '31%' }} >
            <Field
              component={TextInput}
              label="Item Code"
              name="itemCode"
              placeholder="Enter item code..."
              fullWidth={true}
              disabled={true}
              variant="outlined"
              margin="dense"
              style={{ flexGrow: 1 }}
            />
          </Box>
          <Box width={{ xs: '100%', md: '31%' }} >
            <Field
              component={TextInput}
              label="Item Name"
              name="itemName"
              placeholder="Enter item name..."
              fullWidth={true}
              disabled={!categoryId}
              variant="outlined"
              margin="dense"
            />
          </Box>
          <Box width={{ xs: '100%', md: '31%' }}>
            <SelectSupplier formName={formName}  disabled={!categoryId}/>
          </Box>

          <Box width={{ xs: '100%', md: '31%' }} display="inline-flex" justifyContent="space-between" >
            <Box width="48%">
              <Field
                component={TextInput}
                label="Cost Price (unit)"
                name="costPrice"
                placeholder="000"
                fullWidth={true}
                disabled={!categoryId}
                variant="outlined"
                margin="dense"
                type="number"
                inputProps={{  min: 0 }}
                InputProps={{
                  endAdornment:
                    category && category.type === categoryTypes.CATEGORY_TYPE_VARIANT ?
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={copyCostPrice}
                        onMouseDown={(event) => event.preventDefault()}
                      >
                        <FontAwesomeIcon icon={faCopy} size="xs" />
                      </IconButton>
                    </InputAdornment>
                    : null
                  }
                }
              />
            </Box>
            <Box width="48%">
              <Field
                component={TextInput}
                label="Sale Price (unit)"
                name="salePrice"
                placeholder="000"
                fullWidth={true}
                disabled={!categoryId}
                variant="outlined"
                margin="dense"
                type="number"
                inputProps={{  min: 0 }}
                InputProps={{
                  endAdornment:
                    category && category.type === categoryTypes.CATEGORY_TYPE_VARIANT ?
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={copySalePrice}
                        onMouseDown={(event) => event.preventDefault()}
                      >
                        <FontAwesomeIcon icon={faCopy} size="xs" />
                      </IconButton>
                    </InputAdornment>
                    : null
                  }
                }
              />
            </Box>
          </Box>

          <Box width={{ xs: '100%', md: '31%' }} display="inline-flex" justifyContent="space-between" >
            <Box width="48%">
              <Field
                component={TextInput}
                label="Minimum Stock"
                name="minStock"
                placeholder="000"
                fullWidth={true}
                disabled={!categoryId}
                variant="outlined"
                margin="dense"
                type="number"
                inputProps={{  min: 0 }}
                InputProps={{
                  endAdornment:
                    category && category.type === categoryTypes.CATEGORY_TYPE_VARIANT ?
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={copyMinStock}
                        onMouseDown={(event) => event.preventDefault()}
                      >
                        <FontAwesomeIcon icon={faCopy} size="xs" />
                      </IconButton>
                    </InputAdornment>
                    : null
                  }
                }
              />
            </Box>
            <Box width="48%">
              <Field
                component={TextInput}
                label="Maximum Stock"
                name="maxStock"
                placeholder="000"
                fullWidth={true}
                disabled={!categoryId}
                variant="outlined"
                margin="dense"
                type="number"
                inputProps={{  min: 0 }}
                InputProps={{
                  endAdornment:
                    category && category.type === categoryTypes.CATEGORY_TYPE_VARIANT ?
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={copyMaxStock}
                        onMouseDown={(event) => event.preventDefault()}
                      >
                        <FontAwesomeIcon icon={faCopy} size="xs" />
                      </IconButton>
                    </InputAdornment>
                    : null
                  }
                }
              />
            </Box>
          </Box>

          <Box width={{ xs: '100%', md: '31%' }} >
            <Field
              component={TextInput}
              label="Item Description"
              name="description"
              placeholder="Item description..."
              fullWidth={true}
              disabled={!categoryId}
              variant="outlined"
              margin="dense"
              multiline={true}
              rows={4}
            />
          </Box>

          <Box width={{ xs: '100%', md: '31%' }} display="inline-flex" flexDirection="column" justifyContent="space-between" alignSelf="flex-start">

            <Box display="flex" justifyContent="space-between">
              <Field
                component={CheckboxInput}
                label="Service Item"
                name="isServiceItem"
                disabled={!categoryId}
              />

              <Field
                component={CheckboxInput}
                label="Active"
                name="isActive"
                disabled={!categoryId}
              />
            </Box>
            
          </Box>
          <Box width={{ xs: '100%', md: '31%' }} alignSelf="flex-start" >
            <Field
              component={UploadFile}
              label="Upload Image"
              name="image"
              disabled={!categoryId}
              filePath="items/"
            />
          </Box>
          

          {
            category && category.type === categoryTypes.CATEGORY_TYPE_STANDARD && 
            <Box width="100%">
              <Panel id="packings" heading="Packings" expanded={false}>
                <Box width="100%">
                  <FieldArray name="packings" component={Packings} unitSalePrice={parseInt(salePrice)}/>
                </Box>
              </Panel>
            </Box>
          }
          {
            category && category.type === categoryTypes.CATEGORY_TYPE_VARIANT && 
            <Box width="100%">
              <Panel id="Variants" heading="Variants" expanded={true}>
                <Box width="100%">
                  <FieldArray name="variants" component={Variants}  formName={formName}  category={category} {...{costPrice, salePrice, minStock, maxStock}}   />
                </Box>
              </Panel>
            </Box>
          }
          
          

          <Box width="100%">
            <Panel id="category-properties" heading="Category Properties" expanded={false}>
              {
                !categoryId ? null :
                <Box display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" width="100%">
                  <Box width={{ xs: '100%', md: '24%' }} >
                    <SelectCategoryProperty formName={formName} categoryId={categoryId} propertyId="property1" />
                  </Box>
                  <Box width={{ xs: '100%', md: '24%' }} >
                    <SelectCategoryProperty formName={formName} categoryId={categoryId} propertyId="property2" />
                  </Box>
                  <Box width={{ xs: '100%', md: '24%' }} >
                    <SelectCategoryProperty formName={formName} categoryId={categoryId} propertyId="property3" />
                  </Box>
                  <Box width={{ xs: '100%', md: '24%' }} >
                    <SelectCategoryProperty formName={formName} categoryId={categoryId} propertyId="property4" />
                  </Box>
                </Box>
              }
            </Panel>
          </Box>

          <Box width="100%">
            <Panel id="item-properties" heading="Item Properties" expanded={false}>
              <Box display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" width="100%">
                <Box width={{ xs: '100%', md: '24%' }} >
                  <SelectItemProperty formName={formName} propertyId="property1" disabled={!categoryId} />
                </Box>
                <Box width={{ xs: '100%', md: '24%' }} >
                  <SelectItemProperty formName={formName} propertyId="property2" disabled={!categoryId} />
                </Box>
                <Box width={{ xs: '100%', md: '24%' }}>
                  <SelectItemProperty fformName={formName} propertyId="property3" disabled={!categoryId} />
                </Box>
                <Box width={{ xs: '100%', md: '24%' }}>
                  <SelectItemProperty formName={formName} propertyId="property4" disabled={!categoryId} />
                </Box>  
              </Box>
            </Panel>
          </Box>


          

        </Box>

        <Box textAlign="center" mt={2}>
          <Button disableElevation type="submit" variant="contained" color="primary" disabled={pristine || submitPreloader || submitting || invalid } >
            Update Item
          </Button>
          {  
            <FormHelperText error={true}   style={{textAlign: 'center', visibility: !submitting && error ? 'visible' : 'hidden' }}>
              <Typography component="span">{ error ? error : 'invalid request' }</Typography>
            </FormHelperText>  
          }
        </Box>

      </form>
    }
    </>
  )
}

//Variant Start
function Variants({ fields, costPrice, salePrice, minStock, maxStock, category, formName, meta: { error, submitFailed, ...rest } }){
  const sizes = useSelector(state => formSelector(state, 'sizes'));
  const combinations = useSelector(state => formSelector(state, 'combinations'));
  const itemCode = useSelector(state => formSelector(state, 'itemCode'));
  useEffect(() => {
    let variants = [];
    //Make all possible variants first with selected sizes and colors
    for(let sizeIndex = 0; sizeIndex < sizes.length; sizeIndex++)
    {
      let size = sizes[sizeIndex];
      for(let combIndex = 0; combIndex < combinations.length; combIndex++)
      {
        let combination = combinations[combIndex];
        variants.push({
          sizeId: size._id,
          sizeCode: size.code,
          sizeName: size.title,
          
          combinationId: combination._id,
          combinationCode: combination.code,
          combinationName: combination.title,
          costPrice, salePrice, minStock, maxStock
        });   
      }
    }
    //remove Variants if user de-selected any size/color
    let indexesToBeRemoved = [];
    for(let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++)
    {
      let item = fields.get(fieldIndex);
      const exists = variants.find(variant => variant.sizeId === item.sizeId && variant.combinationId === item.combinationId);
      if(!exists) indexesToBeRemoved.push(fieldIndex);
    }
    for(let i = 0; i<indexesToBeRemoved.length; i++)
    {
      fields.remove( indexesToBeRemoved[i] - i ); //length of fields stack reduce by 1 on each remove so adjust index
    }

    //add New variant if user selected new size/color
    for(let variantIndex = 0; variantIndex < variants.length; variantIndex++)
    {
      let variant = variants[variantIndex];
      let exist = false;
      for(let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++)
      {
        let item = fields.get(fieldIndex);
        if(item.sizeId === variant.sizeId && item.combinationId === variant.combinationId)
        {
          exist = true;
          break;
        }
      }
      if(!exist)
        fields.push(variant);
    }
  }, [sizes, combinations]);
  return(
    <>
    <Box display="flex" justifyContent="space-between" flexWrap="wrap">
      <Box width="100%" display="flex" flexWrap="wrap" justifyContent="space-between">
        <Box width={{ xs: '100%', md: '48%' }}>
          <SelectCategorySize formName={formName} categoryId={category._id} />    
        </Box>
        <Box width={{ xs: '100%', md: '48%' }}>
          <SelectCategoryCombination formName={formName} categoryId={category._id} />    
        </Box>
      </Box>

      <Box width={{ xs: '100%', md: '100%' }} >
        {
          fields.map((item, index) => {
            let variant = fields.get(index);
            return(
            <Box width="100%" pt={2} key={index} display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="flex-start" style={{ borderBottom: "2px solid #ececec" }}>

              <Box width={{ xs: '100%', md: "35%" }} mt={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography align="left" style={{ color: '#6c6a6a' }}>{itemCode}-{variant.sizeCode}-{variant.combinationCode} </Typography>
                  <Typography align="center" style={{ color: '#6c6a6a' }}>{ variant.sizeName } | { variant.combinationName }</Typography>
                </Box>
              </Box>

              <Box width={{ xs: '48%', md: '15%' }}>
                <Field
                    component={TextInput}
                    label="Cost Price"
                    name={`${item}.costPrice`}
                    placeholder="Cost Price..."
                    fullWidth={true}
                    variant="outlined"
                    margin="dense"
                    type="number"
                    inputProps={{  min: 0 }}
                />
              </Box>

              <Box width={{ xs: '48%', md: '15%' }}>
                <Field
                    component={TextInput}
                    label="Sale Price"
                    name={`${item}.salePrice`}
                    placeholder="Sale Price..."
                    fullWidth={true}
                    variant="outlined"
                    margin="dense"
                    type="number"
                    inputProps={{  min: 0 }}
                />
              </Box>

              <Box width={{ xs: '48%', md: '15%' }}>
                <Field
                    component={TextInput}
                    label="Minimum Stock"
                    name={`${item}.minStock`}
                    placeholder="Minimum stock..."
                    fullWidth={true}
                    variant="outlined"
                    margin="dense"
                    type="number"
                    inputProps={{  min: 0 }}
                />
              </Box>

              <Box width={{ xs: '48%', md: '15%' }}>
                <Field
                    component={TextInput}
                    label="Maximum Stock"
                    name={`${item}.maxStock`}
                    placeholder="Maximum Stock..."
                    fullWidth={true}
                    variant="outlined"
                    margin="dense"
                    type="number"
                    inputProps={{  min: 0 }}
                />
              </Box>

            </Box>
          )
          }
          )
        }
      </Box>
    </Box>
    </>
  )
}
//Varient End

//packing Start
function Packings({ fields, unitSalePrice, meta: { error, submitFailed, ...rest } }){
  const dispatch = useDispatch();
  const itemCode = useSelector(state => formSelector(state, 'itemCode'));
  const packings = useSelector(state => formSelector(state, 'packings'));
  let lastSavedPackCode = 1;
  let oldPackCount = 0;
  for(let i=0; i<packings.length; i++)
  { 
    if(packings[i].itemCode && parseInt(packings[i].itemCode.slice(-1)) > lastSavedPackCode)
    {
      lastSavedPackCode = parseInt(packings[i].itemCode.slice(-1));
      oldPackCount++;
    }
  }
  
  return(
    <>
    <Box width="100%">
      <Box display="flex" alignItems="center" justifyContent="flex-end">
        <Button variant="outlined" startIcon={ <FontAwesomeIcon icon={faPlus} size="xs" /> } onClick={() => fields.push({})}>Add</Button>
      </Box>
    </Box>
    {
      fields.map( (pack, index) => (
        <Box width="100%" borderBottom={{ xs: 1 , md: 0 }} paddingBottom={{ xs: 2, md: 0 }} display="inline-flex" flexWrap="wrap" justifyContent="space-between" key={index}>
          <Box width={{ xs: '100%', md: '10%' }} >
            <FormHelperText style={{ textAlign: 'right', marginTop: 20 }}>
              { packings[index].itemCode ?  packings[index].itemCode  :  (
                itemCode ?  itemCode + '-P' + ( (lastSavedPackCode + index) - (oldPackCount - 1)  )  :  <span>&nbsp;</span>
              )}
            </FormHelperText>
          </Box>
          <Box width={{ xs: '100%', md: '24%' }} >
            <Field
              component={TextInput}
              label="Pack Name"
              name={`${pack}.itemName`}
              placeholder="Pack name..."
              fullWidth={true}
              variant="outlined"
              margin="dense"
            />
          </Box>
          <Box width={{ xs: '100%', md: '24%' }} >
            <Field
              component={TextInput}
              label="Pack Quantity"
              name={`${pack}.packQuantity`}
              placeholder="Pack quantity..."
              onChange={(event, newvalue) => {
                const packSalePrice = parseInt(newvalue) * (unitSalePrice ? unitSalePrice : 0);
                dispatch( change(formName, `${pack}.packSalePrice`, packSalePrice) );
              }}
              fullWidth={true}
              variant="outlined"
              margin="dense"
              type="number"
              inputProps={{  min: 2 }}
            />
          </Box>
          <Box width={{ xs: '100%', md: '24%' }} >
            <Field
                component={TextInput}
                label="Pack Sale Price"
                name={`${pack}.packSalePrice`}
                placeholder="Pack sale price..."
                fullWidth={true}
                variant="outlined"
                margin="dense"
                type="number"
                inputProps={{  min: 0 }}
            />
          </Box>
          <Box width={{ xs: '100%', md: '14%' }} textAlign="center" display="flex" justifyContent="center" alignItems="flex-start" pt={1} >
            { packings[index].preventDelete !== true && <Button variant="outlined" style={{ marginTop: 8 }} startIcon={ <FontAwesomeIcon icon={faTimes} size="xs" /> } onClick={() => fields.remove(index)}>Remove</Button> }
            { packings[index].preventDelete === true && 
              <Tooltip title="Sales/Purchase records exist against this packing so it cannot be deleted">
                <IconButton> <FontAwesomeIcon icon={faInfoCircle} size="xs" /> </IconButton>
              </Tooltip>
            }
          </Box>
        </Box>
      ))
    }
    </>
  )
}
//Packing End

const onSubmit = (values, dispatch, { storeId }) => {
  dispatch(showProgressBar());
  return axios.post('/api/items/update', {storeId, ...values}).then( response => {
    dispatch(hideProgressBar());
    if(response.data.item._id)
    {
      dispatch( updateItem(storeId, values._id,  response.data.item, response.data.now, response.data.lastAction, response.data.deletedSubItems) );
      dispatch( showSuccess("Item Updated") );
    }

  }).catch(err => {
    dispatch(hideProgressBar());
    throw new SubmissionError({
      _error: err.response && err.response.data.message ? err.response.data.message: err.message
    });
  });
}


const validate = (values, props) => {
  const { dirty, category } = props;
  if(!dirty) return {};
  const errors = {};
  if(!values.itemName)
   errors.itemName = "Item name is required";
  if(category && category.type === categoryTypes.CATEGORY_TYPE_VARIANT && values.sizes.length === 0)
    errors.sizes = "Please select at least one size";
  if(category && category.type === categoryTypes.CATEGORY_TYPE_VARIANT && values.combinations.length === 0)
    errors.combinations = "Please select at least one color";
  return errors;
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  const categoryId = formSelector(state, 'categoryId');
  const categories = state.categories[storeId] ? state.categories[storeId] : [];
  const category = categories.find(item => item._id === categoryId);

  return{
    storeId,
    categoryId,
    category,
    variants: formSelector(state, 'variants'),
    costPrice: formSelector(state, 'costPrice'),
    salePrice: formSelector(state, 'salePrice'),
    minStock: formSelector(state, 'minStock'),
    maxStock: formSelector(state, 'maxStock'),
  }
}

export default compose(
connect(mapStateToProps, { showProgressBar, hideProgressBar, showError }),
reduxForm({
  'form': formName,
  validate,
  onSubmit
})
)(EditItem);