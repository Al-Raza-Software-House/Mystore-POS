import { actionTypes } from '../actions/customerActions';
import { actionTypes as systemActions } from 'store/actions/systemActions';
const initState = {
}

const customerReducer = (state = initState, action) => {
  let customers = null;
  switch(action.type)
  {
    case systemActions.RESET_APP_STATE:
      return initState;
    case actionTypes.CUSTOMERS_LOADED:
      customers = state[action.storeId] ? state[action.storeId] : [];
      return{
        ...state,
        [action.storeId]: [...customers, ...action.customers]
      }
    case actionTypes.EMPTY_CUSTOMERS:
      return{
        ...state,
        [action.storeId]: []
      }
    case actionTypes.SYNC_CUSTOMERS:
      customers = state[action.storeId] ? state[action.storeId] : [];
      let masterCustomers = [...customers];
      action.customers.reverse(); //keep the newly created suppliers in of array, ,
      for(let i=0; i<action.customers.length; i++)
      {
        let customerIndex = masterCustomers.findIndex(item => item._id === action.customers[i]._id);
        if(customerIndex >= 0)
          masterCustomers[customerIndex] = action.customers[i]; //replace/update item
        else
          masterCustomers = [action.customers[i], ...masterCustomers]; //new item
      }
      return{
        ...state,
        [action.storeId]: masterCustomers
      }
    case actionTypes.CUSTOMER_CREATED:
      customers = state[action.storeId] ? state[action.storeId] : [];
      return{
        ...state,
         [action.storeId]: [action.customer, ...customers]
      }
    case actionTypes.CUSTOMER_UPDATED:
      customers = state[action.storeId] ? state[action.storeId] : [];
      customers = customers.map(item => item._id === action.customerId ? action.customer : item);
      return{
        ...state,
         [action.storeId]: [...customers]
      }
    case actionTypes.CUSTOMER_DELETED:
      customers = state[action.storeId] ? state[action.storeId] : [];
      customers = customers.filter(item => item._id !== action.customerId);
      return{
        ...state,
         [action.storeId]: [...customers]
      }
    default:
      return state;
  }
}

export default customerReducer;