import { actionTypes } from '../actions/supplierActions';
const initState = {
}

const supplierReducer = (state = initState, action) => {
  let suppliers = null;
  switch(action.type)
  {
    case actionTypes.SUPPLIERS_LOADED:
      return{
        ...state,
        [action.storeId]: action.suppliers
      }
    case actionTypes.SUPPLIER_CREATED:
      suppliers = state[action.storeId] ? state[action.storeId] : [];
      return{
        ...state,
         [action.storeId]: [...suppliers, action.supplier]
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