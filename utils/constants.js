const storeStates = {
  STORE_STATUS_ACTIVE: 1,
  STORE_STATUS_DELETED: 2,
}

const userRoles = {
  USER_ROLE_OWNER: 1,
  USER_ROLE_MANAGER: 2,
  USER_ROLE_SALESPERSON: 3,
}

const categoryTypes = {
  CATEGORY_TYPE_STANDARD : 1,
  CATEGORY_TYPE_VARIANT: 2
}

const itemTypesFilter = {
  LOW_STOCK_ITEMS: 1,
  OVER_STOCK_ITEMS: 2,
  EXPIRED_ITEMS: 3,
  SERVICE_ITEMS: 4,
  ACTIVE_ITEMS: 5,
  INACTIVE_ITEMS: 6,
}

const stockTxnTypes = {
  TXN_TYPE_PURCHASE: 1,
  TXN_TYPE_VENDOR_RETURN: 2,
  TXN_TYPE_SALE: 3,
  TXN_TYPE_ADJUSTMENT: 4
}

const accountHeadTypes = {
  ACCOUNT_HEAD_TYPE_INCOME: 1,
  ACCOUNT_HEAD_TYPE_EXPENSE: 2,
  ACCOUNT_HEAD_TYPE_GENERAL: 3
}

module.exports = {
  storeStates,
  userRoles,
  categoryTypes,
  itemTypesFilter,
  stockTxnTypes,
  accountHeadTypes
}