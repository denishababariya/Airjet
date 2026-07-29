import React, { createContext, useContext, useState, useEffect } from 'react';
import { rolePermissionsApi } from '../utils/api';

const PermissionContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

const ROLE_MODULES = {
  'Super Admin': ['Dashboard','Employees','Attendance','Payroll','Purchase','Sales','Spare Parts','Inventory','Warehouse','Service','Accounts','Reports','Roles','Settings'],
  'Admin': ['Dashboard','Employees','Attendance','Payroll','Purchase','Sales','Spare Parts','Inventory','Warehouse','Service','Accounts','Reports','Roles','Settings'],
  'Sales Manager': ['Dashboard','Sales','Customers','Reports','Spare Parts','Inventory','Attendance'],
  'Sales Executive': ['Dashboard','Sales','Customers'],
  'Purchase Manager': ['Dashboard','Purchase','Suppliers','Reports','Spare Parts','Inventory','Attendance'],
  'Purchase Executive': ['Dashboard','Purchase','Suppliers'],
  'Inventory Manager': ['Dashboard','Spare Parts','Inventory','Warehouse','Reports','Attendance'],
  'Warehouse Staff': ['Dashboard','Spare Parts','Inventory'],
  'HR Manager': ['Dashboard','Employees','Attendance','Payroll','Reports'],
  'Accountant': ['Dashboard','Accounts','Reports','Purchase','Sales'],
  'Service Manager': ['Dashboard','Service','Reports','Attendance'],
  'Quality Inspector': ['Dashboard','Reports'],
  'CEO/Director': ['Dashboard','Reports'],
  'User': ['Dashboard'],
};

export const PermissionProvider = ({ children, currentUser }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchPermissions();
    } else {
      setPermissions([]);
      setLoading(false);
    }
  }, [currentUser]);

  const fetchPermissions = async () => {
    try {
      const res = await rolePermissionsApi.getMyPermissions();
      setPermissions(res.data.permissions || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (module, action = 'read') => {
    if (!currentUser) return false;
    
    if (currentUser.role === 'Admin' || currentUser.role === 'Super Admin') {
      return true;
    }

    const modulePerms = permissions.filter(p => p.permission?.module === module);
    if (modulePerms.length > 0) {
      return modulePerms.some(p => p[`can${action.charAt(0).toUpperCase() + action.slice(1)}`]);
    }

    const allowedModules = ROLE_MODULES[currentUser.role] || [];
    return allowedModules.includes(module);
  };

  const hasModuleAccess = (module) => {
    return hasPermission(module, 'read');
  };

  const canCreate = (module) => hasPermission(module, 'create');
  const canRead = (module) => hasPermission(module, 'read');
  const canUpdate = (module) => hasPermission(module, 'update');
  const canDelete = (module) => hasPermission(module, 'delete');
  const canApprove = (module) => hasPermission(module, 'approve');
  const canExport = (module) => hasPermission(module, 'export');

  const value = {
    permissions,
    loading,
    hasPermission,
    hasModuleAccess,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canApprove,
    canExport,
    refreshPermissions: fetchPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};
