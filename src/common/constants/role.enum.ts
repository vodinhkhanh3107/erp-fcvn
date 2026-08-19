/**
 * Enum Role dùng CHUNG cho toàn hệ thống — đặt ở common/ (không thuộc module nào)
 * để mọi module (Employee, Task, Department, KPI... sau này) đều import từ
 * đúng 1 nguồn duy nhất, tránh mỗi module tự định nghĩa 1 kiểu Role khác nhau.
 */
export enum Role {
  ADMIN = 'admin',
  HR = 'hr',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
  ACCOUNTANT = "accountant",
  BOD = "bod",
  PURCHASING="purchasing"
}
