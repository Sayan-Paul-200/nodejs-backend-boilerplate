// Handle permission types and interfaces for IAM module

export enum Action {
  DELETE = 1, // 0001
  UPDATE = 2, // 0010
  READ = 4,   // 0100
  CREATE = 8, // 1000
}

export type PermissionBitmask = number; // 0 to 15

// Generic list of SaaS Resources (Add more as you grow)
export type ResourceDomain = 
  | 'system:users'
  | 'billing:invoices'
  | 'inventory:products'
  | 'orders:logistics';

export type RolePermissions = {
  [resource in ResourceDomain]?: {
    default: PermissionBitmask;
    conditional?: boolean; // If true, requires ownership check
  };
};