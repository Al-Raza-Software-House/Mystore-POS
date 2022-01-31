import { actionTypes } from '../actions/accountActions';
import { actionTypes as systemActions } from 'store/actions/systemActions';
const initState = {
  heads: {},
  banks: {},
  transactions: {}
}
const defaultStoreTransactions = {
  records: [],
  totalRecords: 0,
  recordsLoaded: false,
  filters: {},
}
const accountsReducer = (state = initState, action) => {
  let heads = null;
  let banks = null;
  let storeTxns = null;
  let newTxns = null;
  switch(action.type)
  {
    case systemActions.RESET_APP_STATE:
      return initState;
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
        recordsLoaded: true,
        filters: storeTxns.filters
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
        recordsLoaded: true,
        filters: storeTxns.filters
      }
      return{
        ...state,
        transactions:{
          ...state.transactions,
          [action.storeId]: newTxns
        }
      }
    case actionTypes.TRANSACTION_DELETED:
      storeTxns = state.transactions[action.storeId] ? state.transactions[action.storeId] : defaultStoreTransactions;
      let hasParentTxn = storeTxns.records.find(record => record.parentId === action.txnId); //Bank deposit/withdrawl has two txns
      newTxns = {
        records: storeTxns.records.filter(record => record._id !== action.txnId && record.parentId !== action.txnId),
        totalRecords: storeTxns.totalRecords - (hasParentTxn ? 2 : 1),
        recordsLoaded: storeTxns.recordsLoaded,
        filters: storeTxns.filters
      }
      return{
        ...state,
        transactions:{
          ...state.transactions,
          [action.storeId]: newTxns
        }
      }
    case actionTypes.TRANSACTION_UPDATED:
      storeTxns = state.transactions[action.storeId] ? state.transactions[action.storeId] : defaultStoreTransactions;
      //special case of "Bank Account" head which creates two txns when cash is deposited or withdrawn from bank
      let totalRecords = storeTxns.totalRecords;
      let transactions = storeTxns.records;
      const txn = action.txns[0];
      transactions = transactions.map(record => record._id === txn._id ? txn : record);

      const bankTxn = action.txns[1] ? action.txns[1] : null;
      const oldBankTxn = transactions.find(record => record.parentId === txn._id);
      if(bankTxn && oldBankTxn) //head not changed, update bank transaction
      {
        transactions = transactions.map(record => record._id === bankTxn._id ? bankTxn : record);
      }else if(bankTxn && !oldBankTxn) //head changed to Bank Account, add a bank account txn
      {
        let parentIndex = transactions.findIndex(record => record._id === txn._id);
        transactions.splice(parentIndex + 1, 0, bankTxn);
        totalRecords = totalRecords + 1;
      }else if(!bankTxn && oldBankTxn) //head changd from bank account to some other head, delete bank txn
      {
        transactions = transactions.filter(record => record._id !== oldBankTxn._id);
        totalRecords = totalRecords - 1;
      }
      newTxns = {
        records: transactions,
        totalRecords: totalRecords,
        recordsLoaded: true,
        filters: storeTxns.filters
      }
      return{
        ...state,
        transactions:{
          ...state.transactions,
          [action.storeId]: newTxns
        }
      }
    case actionTypes.EMPTY_TRANSACTIONS:
      storeTxns = state.transactions[action.storeId] ? state.transactions[action.storeId] : defaultStoreTransactions;
      return{
        ...state,
        transactions:{
          ...state.transactions,
          [action.storeId]: {
            ...defaultStoreTransactions,
            filters: storeTxns.filters
          }
        }
      }
    case actionTypes.FILTERS_CHANGED:
      return{
        ...state,
        transactions:{
          ...state.transactions,
          [action.storeId]: {
            ...defaultStoreTransactions,
            filters: action.filters
          }
        }
      }
    default:
      return state;
  }
}

export default accountsReducer;