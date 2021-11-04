import { actionTypes } from '../actions/accountActions';
const initState = {
  heads: {},
  banks: {},
  transactions: {}
}
const defaultStoreTransactions = {
  records: [],
  totalRecords: 0,
  recordsLoaded: false
}
const accountsReducer = (state = initState, action) => {
  let heads = null;
  let banks = null;
  let storeTxns = null;
  let newTxns = null;
  switch(action.type)
  {
    //ACCOUNT HEAD cases
    case actionTypes.ACCOUNT_HEADS_LOADED:
      return{
        ...state,
        heads: {
          ...state.heads,
          [action.storeId]: action.heads
        }
      }
    case actionTypes.ACCOUNT_HEAD_CREATED:
      heads = state.heads[action.storeId] ? state.heads[action.storeId] : [];
      return{
        ...state,
        heads:{
          ...state.heads,
          [action.storeId]: [action.head, ...heads]
        }
      }
    case actionTypes.ACCOUNT_HEAD_UPDATED:
      heads = state.heads[action.storeId] ? state.heads[action.storeId] : [];
      heads = heads.map(item => item._id === action.headId ? action.head : item);
      return{
        ...state,
        heads:{
          ...state.heads,
          [action.storeId]: [...heads]
        }
      }
    case actionTypes.ACCOUNT_HEAD_DELETED:
      heads = state.heads[action.storeId] ? state.heads[action.storeId] : [];
      heads = heads.filter(item => item._id !== action.headId);
      return{
        ...state,
         heads:{
          ...state.heads,
          [action.storeId]: [...heads]
        }
      }


    //BANK cases
    case actionTypes.BANKS_LOADED:
      return{
        ...state,
        banks: {
          ...state.banks,
          [action.storeId]: action.banks
        }
      }
    case actionTypes.BANK_CREATED:
      banks = state.banks[action.storeId] ? state.banks[action.storeId] : [];
      if(action.bank.default)
      {
        banks = banks.map(bank => ({...bank, default: false})); //un-default the rest of banks
      }
      return{
        ...state,
        banks:{
          ...state.banks,
          [action.storeId]: [action.bank, ...banks]
        }
      }
    case actionTypes.BANK_UPDATED:
      banks = state.banks[action.storeId] ? state.banks[action.storeId] : [];
      if(action.bank.default)
      {
        banks = banks.map(bank => ({...bank, default: false})); //un-default the rest of banks
      }
      banks = banks.map(item => item._id === action.bankId ? action.bank : item);
      return{
        ...state,
        banks:{
          ...state.banks,
          [action.storeId]: [...banks]
        }
      }
    case actionTypes.BANK_DELETED:
      banks = state.banks[action.storeId] ? state.banks[action.storeId] : [];
      banks = banks.filter(item => item._id !== action.bankId);
      return{
        ...state,
         banks:{
          ...state.banks,
          [action.storeId]: [...banks]
        }
      }

    //Transaction cases
    case actionTypes.TRANSACTIONS_LOADED:
      storeTxns = state.transactions[action.storeId] ? state.transactions[action.storeId] : defaultStoreTransactions;
      newTxns = {
        records: [...storeTxns.records, ...action.txns],
        totalRecords: action.totalRecords,
        recordsLoaded: true
      }
      return{
        ...state,
        transactions:{
          ...state.transactions,
          [action.storeId]: newTxns
        }
      }

    case actionTypes.TRANSACTION_ADDED:
      storeTxns = state.transactions[action.storeId] ? state.transactions[action.storeId] : defaultStoreTransactions;
      newTxns = {
        records: [...action.txns, ...storeTxns.records],
        totalRecords: storeTxns.totalRecords + action.txns.length,
        recordsLoaded: true
      }
      return{
        ...state,
        transactions:{
          ...state.transactions,
          [action.storeId]: newTxns
        }
      }
    default:
      return state;
  }
}

export default accountsReducer;