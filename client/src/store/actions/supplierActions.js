// import axios from "axios";
// import { showSuccess } from './alertActions';
// import { hideProgressBar, showProgressBar } from "./progressActions"

export const actionTypes = {
  SUPPLIERS_LOADED: 'suppliersLoaded',
  SUPPLIER_CREATED: 'supplierCreated',
  SUPPLIER_DELETED: 'supplierDeleted',
  SUPPLIER_UPDATED: 'supplierUpdated',
}

// export const loadCategories = () => {
//   return (dispatch, getState) => {
//     const state = getState();
//     const storeId = state.stores.selectedStoreId;
//     if(!state.categories[storeId] || state.categories[storeId].length === 0)
//       dispatch(showProgressBar());
//     axios.get('/api/categories', { params: { storeId } }).then( ({ data }) => {
//       if(!state.categories[storeId] || state.categories[storeId].length === 0)
//         dispatch(hideProgressBar());
//       dispatch({ type: actionTypes.CATEGORIES_LOADED, storeId, categories: data });
//     }).catch( err => err );
//   }
// }

export const createSupplier = (storeId, supplier) => {
  return { type: actionTypes.SUPPLIER_CREATED, storeId, supplier }
}

// export const deleteCategory = (storeId, categoryId) => {
//   return (dispatch, getState) => {
//     dispatch(showProgressBar());
//     axios.post('/api/categories/delete', { storeId, categoryId }).then( ({ data }) => {
//       dispatch(hideProgressBar());
//       dispatch( { type: actionTypes.CATEGORY_DELETED, storeId, categoryId } );
//       dispatch( showSuccess('Category deleted') );
//     }).catch( err => err );
//   }
// }



// export const updateCategory = (storeId, categoryId, category) => {
//   return { type: actionTypes.CATEGORY_UPDATED, storeId, categoryId, category }
// }