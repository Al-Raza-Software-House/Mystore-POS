import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faLongArrowAltLeft, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Link, useHistory } from 'react-router-dom';
import { Button, Box, Typography, FormHelperText, InputAdornment, IconButton } from '@material-ui/core'
import { change, Field, FieldArray, formValueSelector, reduxForm, SubmissionError } from 'redux-form';
import axios from 'axios';
import { showProgressBar, hideProgressBar } from '../../../store/actions/progressActions';
import { createItem } from '../../../store/actions/itemActions';
import { connect, useDispatch, useSelector } from 'react-redux';
import { showSuccess } from '../../../store/actions/alertActions';
import { compose } from 'redux';
import SelectCategory from './itemForm/SelectCategory';
import ItemCode from './itemForm/ItemCode';
import TextInput from '../../library/form/TextInput';
import SelectSupplier from './itemForm/SelectSupplier';
import CheckboxInput from '../../library/form/CheckboxInput';
import SelectCategoryProperty from './itemForm/SelectCategoryProperty';
import SelectItemProperty from './itemForm/SelectItemProperty';
import UploadFile from '../../library/UploadFile';
import { categoryTypes } from '../../../utils/constants';
import Panel from '../../library/Panel';
import SelectCategorySize from './itemForm/SelectCategorySize';
import SelectCategoryCombination from './itemForm/SelectCategoryCombination';
import { allowOnlyPostiveNumber } from '../../../utils';

const formSelector = formValueSelector('createItem');

function CreateItem(props){
  const { dispatch, handleSubmit, pristine, submitSucceeded, submitting, error, invalid, dirty, storeId } = props;
  const { categoryId, category, variants, costPrice, salePrice, minStock, maxStock } = props;

  

  const copyCostPrice = () => {
    variants.forEach((variant, index) => {
      dispatch( change('createItem', `variants[${index}].costPrice`, costPrice) );
    });
  }
  const copySalePrice = () => {
    variants.forEach((variant, index) => {
      dispatch( change('createItem', `variants[${index}].salePrice`, salePrice) );
    });
  }
  const copyMinStock = () => {
    variants.forEach((variant, index) => {
      dispatch( change('createItem', `variants[${index}].minStock`, minStock) );
    });
  }
  const copyMaxStock = () => {
    variants.forEach((variant, index) => {
      dispatch( change('createItem', `variants[${index}].maxStock`, maxStock) );
    });
  }


  const history = useHistory();
  useEffect(() => {
    if(submitSucceeded)
      history.push('/stock');
  }, [submitSucceeded, history])
  return(
    <>
    <Box width="100%" justifyContent="space-between" display="flex">
      <Typography gutterBottom variant="h6" style={{ flexGrow: 1 }} align="center">Create New Item</Typography>
      <Button disableElevation color="primary" startIcon={<FontAwesomeIcon icon={faLongArrowAltLeft} />} component={Link} to="/stock">
        Items
      </Button>
    </Box>
    <form onSubmit={handleSubmit}>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
        <Box width={{ xs: '100%', md: '31%' }} >
          <SelectCategory formName="createItem"/>
        </Box>
        <Box width={{ xs: '100%', md: '31%' }} >
          <ItemCode formName="createItem" categoryId={categoryId} />
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
          <SelectSupplier formName="createItem"  disabled={!categoryId}/>
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
              onKeyDown={allowOnlyPostiveNumber}
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
              onKeyDown={allowOnlyPostiveNumber}
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
              onKeyDown={allowOnlyPostiveNumber}
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
              onKeyDown={allowOnlyPostiveNumber}
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

        <Box width={{ xs: '100%', md: '31%' }} display="inline-flex" flexDirection="column" justifyContent="center" alignSelf="flex-start">

          <Field
            component={CheckboxInput}
            label="Service Item"
            name="isServiceItem"
            disabled={!categoryId}
          />
          
        </Box>
        <Box width={{ xs: '100%', md: '31%' }} alignSelf="flex-start" >
          <Field
            component={UploadFile}
            label="Upload Image"
            storeId={storeId}
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
                <FieldArray name="variants" component={Variants}  formName="createItem"  category={category} {...{costPrice, salePrice, minStock, maxStock}}   />
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
                  <SelectCategoryProperty formName="createItem" categoryId={categoryId} propertyId="property1" />
                </Box>
                <Box width={{ xs: '100%', md: '24%' }} >
                  <SelectCategoryProperty formName="createItem" categoryId={categoryId} propertyId="property2" />
                </Box>
                <Box width={{ xs: '100%', md: '24%' }} >
                  <SelectCategoryProperty formName="createItem" categoryId={categoryId} propertyId="property3" />
                </Box>
                <Box width={{ xs: '100%', md: '24%' }} >
                  <SelectCategoryProperty formName="createItem" categoryId={categoryId} propertyId="property4" />
                </Box>
              </Box>
            }
          </Panel>
        </Box>

        <Box width="100%">
          <Panel id="item-properties" heading="Item Properties" expanded={false}>
            <Box display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" width="100%">
              <Box width={{ xs: '100%', md: '24%' }} >
                <SelectItemProperty formName="createItem" propertyId="property1" disabled={!categoryId} />
              </Box>
              <Box width={{ xs: '100%', md: '24%' }} >
                <SelectItemProperty formName="createItem" propertyId="property2" disabled={!categoryId} />
              </Box>
              <Box width={{ xs: '100%', md: '24%' }}>
                <SelectItemProperty formName="createItem" propertyId="property3" disabled={!categoryId} />
              </Box>
              <Box width={{ xs: '100%', md: '24%' }}>
                <SelectItemProperty formName="createItem" propertyId="property4" disabled={!categoryId} />
              </Box>  
            </Box>
          </Panel>
        </Box>


        

      </Box>

      <Box textAlign="center" mt={2}>
        <Button disableElevation type="submit" variant="contained" color="primary" disabled={pristine || submitting || invalid || !dirty} >
          Add Item
        </Button>
        {  
          <FormHelperText error={true}   style={{textAlign: 'center', visibility: !submitting && error ? 'visible' : 'hidden' }}>
            <Typography component="span">{ error ? error : 'invalid request' }</Typography>
          </FormHelperText>  
        }
      </Box>

    </form>
    </>
  )
}

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
                    onKeyDown={allowOnlyPostiveNumber}
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
                    onKeyDown={allowOnlyPostiveNumber}
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
                    onKeyDown={allowOnlyPostiveNumber}
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
                    onKeyDown={allowOnlyPostiveNumber}
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

function Packings({ fields, unitSalePrice, meta: { error, submitFailed, ...rest } }){
  const dispatch = useDispatch();
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
          <Box width={{ xs: '100%', md: '20%' }} >
            <Field
              component={TextInput}
              label="Pack Code"
              name={`${pack}.itemCode`}
              placeholder="Pack code/barcode..."
              fullWidth={true}
              variant="outlined"
              margin="dense"
              onKeyPress={event => {if(event.key === "Enter") event.preventDefault()}}
            />
          </Box>
          <Box width={{ xs: '100%', md: '20%' }} >
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
          <Box width={{ xs: '100%', md: '20%' }} >
            <Field
              component={TextInput}
              label="Pack Quantity"
              name={`${pack}.packQuantity`}
              placeholder="Pack quantity..."
              onChange={(event, newvalue) => {
                const packSalePrice = parseInt(newvalue) * (unitSalePrice ? unitSalePrice : 0);
                dispatch( change('createItem', `${pack}.packSalePrice`, packSalePrice) );
              }}
              fullWidth={true}
              variant="outlined"
              margin="dense"
              type="number"
              inputProps={{  min: 2 }}
              onKeyDown={allowOnlyPostiveNumber}
            />
          </Box>
          <Box width={{ xs: '100%', md: '20%' }} >
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
                onKeyDown={allowOnlyPostiveNumber}
            />
          </Box>
          <Box width={{ xs: '100%', md: '14%' }} textAlign="center" >
            <Button variant="outlined" style={{ marginTop: 8 }} startIcon={ <FontAwesomeIcon icon={faTimes} size="xs" /> } onClick={() => fields.remove(index)}>Remove</Button>
          </Box>
        </Box>
      ))
    }
    </>
  )
}

const onSubmit = (values, dispatch, { storeId }) => {
  dispatch(showProgressBar());
  return axios.post('/api/items/create', {storeId, ...values}).then( response => {
    dispatch(hideProgressBar());
    if(response.data.item._id)
    {
      dispatch( createItem(storeId, response.data.item, response.data.now, response.data.lastAction) );
      dispatch( showSuccess("New item added") );
    }

  }).catch(err => {
    dispatch(hideProgressBar());
    throw new SubmissionError({
      _error: err.response && err.response.data.message ? err.response.data.message: err.message
    });
  });
}

const asyncValidate = (values, dispatch, { storeId }) => {
  let itemCodes = [];
  if(values.itemCode) itemCodes.push(values.itemCode);
  for(let index = 0; index < values.packings.length; index++)
  {
    let pack = values.packings[index];
    if(pack.itemCode) itemCodes.push(pack.itemCode);
  }
  if(itemCodes.length === 0) return;
  return axios.get('/api/items/isItemCodeTaken', { params: {storeId, codes: itemCodes} }).then( response => {
    if(response.data.codes)
    {
      let errors = { packings: [] };
      if(values.itemCode && response.data.codes[ values.itemCode ] )
        errors.itemCode = "This item code is already being used by an item";
      for(let index = 0; index < values.packings.length; index++)
      {
        errors.packings[index] = {};
        let pack = values.packings[index];
        if(pack.itemCode && response.data.codes[ pack.itemCode ] )
          errors.packings[index].itemCode = "This code is already taken";
      }
      return Promise.reject(errors);
    }

  })
}

const validate = (values, props) => {
  const { dirty, category } = props;
  if(!dirty) return {};
  let itemCodes = [];
  const errors = {};
  if(!values.categoryId)
    errors.categoryId = "Category is required";
  if(!values.itemCode)
   errors.itemCode = "Item code is required";
  else if(values.itemCode)
    itemCodes.push(values.itemCode.toLowerCase());
  if(!values.itemName)
   errors.itemName = "Item name is required";
  
  if(category && category.type === categoryTypes.CATEGORY_TYPE_STANDARD)
  {
    errors.packings = [];
    for(let index = 0; index < values.packings.length; index++)
    {
      errors.packings[index] = {};
      let pack = values.packings[index];
      if(!pack.itemName) continue;
      if(!pack.itemCode) errors.packings[index].itemCode = "Packing code is required";
      else if(pack.itemCode && itemCodes.indexOf( pack.itemCode.toLowerCase() ) !== -1)
        errors.packings[index].itemCode = "This code is already taken";
      else if(pack.itemCode)
        itemCodes.push( pack.itemCode.toLowerCase() );

      if(!pack.packQuantity || Number(pack.packQuantity) === 0)
        errors.packings[index].packQuantity = "Pack quantity is required";
    }
  } 
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
connect(mapStateToProps),
reduxForm({
  'form': 'createItem',
  validate,
  onSubmit,
  asyncValidate,
  initialValues: { costPrice: 0, salePrice: 0, expiryDate: null, packings: [{}], sizes: [], combinations: [] },
  asyncBlurFields: ['itemCode', 'packings[].itemCode'],
  shouldAsyncValidate: (params) => {
    const { trigger, syncValidationPasses, initialized  } = params;
      if(!syncValidationPasses) {
      return false
    }
    switch(trigger) {
      case 'blur':
        return true
      case 'submit':
        return !initialized
      default:
        return false
    }
  }
})
)(CreateItem)