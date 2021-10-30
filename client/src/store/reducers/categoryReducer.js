import { actionTypes } from '../actions/categoryActions';
const initState = {
}

const categoryReducer = (state = initState, action) => {
  let categories = null;
  switch(action.type)
  {
    case actionTypes.CATEGORIES_LOADED:
      return{
        ...state,
        [action.storeId]: action.categories
      }
    case actionTypes.CATEGORY_CREATED:
      categories = state[action.storeId] ? state[action.storeId] : [];
      return{
        ...state,
         [action.storeId]: [action.category, ...categories]
      }
    case actionTypes.CATEGORY_UPDATED:
      categories = state[action.storeId] ? state[action.storeId] : [];
      categories = categories.map(item => item._id === action.categoryId ? action.category : item);
      return{
        ...state,
         [action.storeId]: [...categories]
      }
    case actionTypes.CATEGORY_DELETED:
      categories = state[action.storeId] ? state[action.storeId] : [];
      categories = categories.filter(item => item._id !== action.categoryId);
      return{
        ...state,
         [action.storeId]: [...categories]
      }
    default:
      return state;
  }
}

export default categoryReducer;