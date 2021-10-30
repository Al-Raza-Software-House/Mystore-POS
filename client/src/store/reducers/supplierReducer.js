import { actionTypes } from '../actions/supplierActions';
const initState = {
}

const supplierReducer = (state = initState, action) => {
  let suppliers = null;
  switch(action.type)
  {
    case actionTypes.SUPPLIERS_LOADED:
      suppliers = state[action.storeId] ? state[action.storeId] : [];
      return{
        ...state,
        [action.storeId]: [...suppliers, ...action.suppliers]
      }
    case actionTypes.EMPTY_SUPPLIERS:
      return{
        ...state,
        [action.storeId]: []
      }
    case actionTypes.SYNC_SUPPLIERS:
      suppliers = state[action.storeId] ? state[action.storeId] : [];
      let masterSuppliers = [...suppliers];
      action.suppliers.reverse(); //keep the newly created suppliers in of array, ,
      for(let i=0; i<action.suppliers.length; i++)
      {
        let supplierIndex = masterSuppliers.findIndex(item => item._id === action.suppliers[i]._id);
        if(supplierIndex >= 0)
          masterSuppliers[supplierIndex] = action.suppliers[i]; //replace/update item
        else
          masterSuppliers = [action.suppliers[i], ...masterSuppliers]; //new item
      }
      return{
        ...state,
        [action.storeId]: masterSuppliers
      }
    case actionTypes.SUPPLIER_CREATED:
      suppliers = state[action.storeId] ? state[action.storeId] : [];
      return{
        ...state,
         [action.storeId]: [action.supplier, ...suppliers]
      }
    case actionTypes.SUPPLIER_UPDATED:
      suppliers = state[action.storeId] ? state[action.storeId] : [];
      suppliers = suppliers.map(item => item._id === action.supplierId ? action.supplier : item);
      return{
        ...state,
         [action.storeId]: [...suppliers]
      }
    case actionTypes.SUPPLIER_DELETED:
      suppliers = state[action.storeId] ? state[action.storeId] : [];
      suppliers = suppliers.filter(item => item._id !== action.supplierId);
      return{
        ...state,
         [action.storeId]: [...suppliers]
      }
    default:
      return state;
  }
}

export default supplierReducer;