export const PERMISSIONS = {
  PERMISSION_MANAGE: 'permission.manage',
  PERMISSION_CREATE: 'permission.create',
  PERMISSION_READ: 'permission.read',
  PERMISSION_UPDATE: 'permission.update',
  PERMISSION_DELETE: 'permission.delete',
  PERMISSION_ASSIGN: 'permission.assign',


  USER_MANAGE: 'user.manage',
  USER_READ: 'user.read',
  USER_READ_DEPARTMENT: 'user.readDepartment',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',


  ROLE_MANAGE: 'role.manage',
  ROLE_READ: 'role.read',
  ROLE_CREATE: 'role.create',
  ROLE_UPDATE: 'role.update',

  DEPARTMENT_MANAGE: 'department.manage',
  DEPARTMENT_READ: 'department.read',
  DEPARTMENT_CREATE: 'department.create',
  DEPARTMENT_UPDATE: 'department.update',


  SUPPLIER_MANAGE: 'supplier.manage',
  SUPPLIER_READ: 'supplier.read',
  SUPPLIER_CREATE: 'supplier.create',
  SUPPLIER_UPDATE: 'supplier.update',

  SUPPLIER_GROUP_MANAGE: 'supplier-group.manage',
  SUPPLIER_GROUP_CREATE: 'supplier-group.manage',
  SUPPLIER_GROUP_READ: 'supplier-group.manage',
  SUPPLIER_GROUP_UPDATE: 'supplier-group.manage',
  SUPPLIER_GROUP_UPDATE_STATUS: 'supplier-group.manage',
  SUPPLIER_GROUP_ASSIGN: 'supplier-group.manage',

  TASK_MANAGE: 'task.manage',
  TASK_READ_ASSIGNED: 'task.readAssigned',
  TASK_READ_DEPARTMENT: 'task.readDepartment',
  TASK_READ_FACILLITY: 'task.readFacillity',
  TASK_READ: 'task.read',
  TASK_CREATE: 'task.create',
  TASK_CREATE_OWN: 'task.createOwn',
  TASK_UPDATE: 'task.update',
  TASK_UPDATE_OWN: 'task.updateOwn',
  TASK_ALLOW_EDIT_WHEN_EXPIRED: 'task.allowEditWhenExpired',
  TASK_DELETE: 'task.delete',
  TASK_DELETE_OWN: 'task.deleteOwn',



  KPI_MANAGE: 'kpi.manage',
  KPI_READ: 'kpi.read',
  KPI_CREATE: 'kpi.create',
  KPI_UPDATE: 'kpi.update',


  ATTENDANCE_MANAGE: 'attendance.manage',
  ATTENDANCE_READ: 'attendance.read',
  ATTENDANCE_CREATE: 'attendance.create',
  ATTENDANCE_UPDATE: 'attendance.update',


  PURCHASE_REQUEST_MANAGE: 'purchase-request.manage',
  PURCHASE_REQUEST_READ: 'purchase-request.read',
  PURCHASE_REQUEST_CREATE: 'purchase-request.create',
  PURCHASE_REQUEST_UPDATE: 'purchase-request.update',
  PURCHASE_REQUEST_APPROVE: 'purchase-request.approve',
  PURCHASE_REQUEST_REJECT: 'purchase-request.reject',
  PURCHASE_REQUEST_SUBMIT: 'purchase-request.submit',
  PURCHASE_REQUEST_HISTORY: 'purchase-request.history',
  PURCHASE_REQUEST_ISSUE: 'purchase-request.issue',



  PURCHASE_ORDER_MANAGE: 'purchase-order.manage',
  PURCHASE_ORDER_READ: 'purchase-order.read',
  PURCHASE_ORDER_CREATE: 'purchase-order.create',

  

  AUDIT_LOG_READ: 'audit-log.read',

  LEAVE_MANAGE: 'leave.manage',
  LEAVE_CREATE: 'leave.create',
  LEAVE_READ: 'leave.read',
  LEAVE_REVIEW: 'leave.review',
  LEAVE_APPROVE: 'leave.approve',
  LEAVE_REJECT: 'leave.reject',
};

export const ALL_PERMISSION_CODES: string[] = Object.values(PERMISSIONS);