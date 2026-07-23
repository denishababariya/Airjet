import React, { useState, useEffect } from 'react';
import {
  MdSecurity, MdAdd, MdEdit, MdDelete, MdCheck, MdClose,
  MdExpandMore, MdExpandLess, MdSave, MdCancel, MdSearch
} from 'react-icons/md';
import Modal from '../components/Modal';
import { rolesApi, permissionsApi, rolePermissionsApi } from '../utils/api';

const blankRole = { name: '', description: '', level: 1 };

const RoleManagement = ({ currentUser }) => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [form, setForm] = useState(blankRole);
  const [expandedModules, setExpandedModules] = useState({});

  const canManageRoles = ['Admin', 'Super Admin'].includes(currentUser?.role);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        rolesApi.getAll(),
        permissionsApi.getAll()
      ]);
      setRoles(rolesRes.data);
      setPermissions(permsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRolePermissions = async (roleId) => {
    try {
      const res = await rolePermissionsApi.getByRole(roleId);
      setRolePermissions(res.data);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
    }
  };

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    fetchRolePermissions(role._id);
  };

  const openAdd = () => {
    setForm(blankRole);
    setEditRole(null);
    setModal(true);
  };

  const openEdit = (role) => {
    setForm({ name: role.name, description: role.description || '', level: role.level });
    setEditRole(role);
    setModal(true);
  };

  const handleSave = async () => {
    try {
      if (editRole) {
        const res = await rolesApi.update(editRole._id, form);
        setRoles(roles.map(r => r._id === editRole._id ? res.data : r));
        if (selectedRole?._id === editRole._id) {
          setSelectedRole(res.data);
        }
      } else {
        const res = await rolesApi.create(form);
        setRoles([...roles, res.data]);
      }
      setModal(false);
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      await rolesApi.remove(roleId);
      setRoles(roles.filter(r => r._id !== roleId));
      if (selectedRole?._id === roleId) {
        setSelectedRole(null);
        setRolePermissions([]);
      }
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  const handlePermissionChange = async (permissionId, action, value) => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await rolePermissionsApi.assign({
        roleId: selectedRole._id,
        permissionId,
        [action]: value
      });
      setRolePermissions(prev => {
        const existing = prev.find(rp => rp.permission?._id === permissionId);
        if (existing) {
          return prev.map(rp =>
            rp.permission?._id === permissionId
              ? { ...rp, [action]: value }
              : rp
          );
        }
        const perm = permissions.find(p => p._id === permissionId);
        return [...prev, { role: selectedRole._id, permission: perm, [action]: value }];
      });
    } catch (error) {
      console.error('Error updating permission:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleModule = (module) => {
    setExpandedModules(prev => ({ ...prev, [module]: !prev[module] }));
  };

  const getPermissionValue = (permissionId, action) => {
    const rp = rolePermissions.find(rp => rp.permission?._id === permissionId);
    return rp ? rp[action] : false;
  };

  const filteredRoles = roles.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {});

  const ACTIONS = [
    { key: 'canCreate', label: 'Create', icon: '➕' },
    { key: 'canRead', label: 'Read', icon: '👁️' },
    { key: 'canUpdate', label: 'Update', icon: '✏️' },
    { key: 'canDelete', label: 'Delete', icon: '🗑️' },
    { key: 'canApprove', label: 'Approve', icon: '✅' },
    { key: 'canExport', label: 'Export', icon: '📤' },
  ];

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title"><MdSecurity className="d_card_icon" /> Role Management</h1>
          <p className="d_page_subtitle">Manage roles and their module permissions</p>
        </div>
        {canManageRoles && (
          <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> Add Role</button>
        )}
      </div>

      <div className="d_card">
        <div className="d_card_header flex-wrap gap-2">
          <h2 className="d_card_title">All Roles ({roles.length})</h2>
          <div className="d_search_box">
            <MdSearch className="d_search_icon" />
            <input className="d_search_input" placeholder="Search roles…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="d_card_body p-0">
          {loading ? (
            <div className="text-center py-4">Loading roles…</div>
          ) : (
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr>
                    <th>Role Name</th>
                    <th>Description</th>
                    <th>Level</th>
                    <th>Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.length === 0 && (
                    <tr className="d_empty"><td colSpan={5}>No roles found.</td></tr>
                  )}
                  {filteredRoles.map(role => (
                    <tr
                      key={role._id}
                      className={selectedRole?._id === role._id ? 'd_active_row' : ''}
                      onClick={() => handleSelectRole(role)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td><strong>{role.name}</strong></td>
                      <td>{role.description || '-'}</td>
                      <td>{role.level}</td>
                      <td>
                        <span className={`d_badge ${role.isSystem ? 'd_info' : 'd_success'}`}>
                          {role.isSystem ? 'System' : 'Custom'}
                        </span>
                      </td>
                      <td>
                        <div className="d_action_btns">
                          {canManageRoles && (
                            <>
                              <button className="d_icon_btn d_edit" onClick={(e) => { e.stopPropagation(); openEdit(role); }} title="Edit"><MdEdit /></button>
                              {!role.isSystem && (
                                <button className="d_icon_btn d_del" onClick={(e) => { e.stopPropagation(); handleDelete(role._id); }} title="Delete"><MdDelete /></button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedRole && (
        <div className="d_card mt-4">
          <div className="d_card_header">
            <h2 className="d_card_title">
              <MdSecurity className="d_card_icon" />
              Permissions for {selectedRole.name}
              {saving && <span className="d_saving_indicator">Saving...</span>}
            </h2>
          </div>
          <div className="d_card_body">
            {Object.entries(groupedPermissions).map(([module, modPerms]) => (
              <div key={module} className="d_perm_module">
                <div className="d_perm_module_header" onClick={() => toggleModule(module)}>
                  {expandedModules[module] ? <MdExpandLess /> : <MdExpandMore />}
                  <span>{module}</span>
                  <span className="d_perm_count">{modPerms.length} permissions</span>
                </div>
                {expandedModules[module] && (
                  <div className="d_perm_module_body">
                    <div className="d_table_wrap">
                      <table className="d_table d_table_sm">
                        <thead>
                          <tr>
                            <th>Permission</th>
                            {ACTIONS.map(action => (
                              <th key={action.key} className="text-center">{action.icon} {action.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {modPerms.map(perm => (
                            <tr key={perm._id}>
                              <td><strong>{perm.name}</strong></td>
                              {ACTIONS.map(action => (
                                <td key={action.key} className="text-center">
                                  <label className="d_perm_checkbox">
                                    <input
                                      type="checkbox"
                                      checked={getPermissionValue(perm._id, action.key)}
                                      onChange={(e) => handlePermissionChange(perm._id, action.key, e.target.checked)}
                                    />
                                  </label>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editRole ? 'Edit Role' : 'Add New Role'} size="md">
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Role Name <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="e.g. Sales Manager" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Description</label>
            <input className="d_form_control" placeholder="Role description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Level <span className="d_req">*</span></label>
            <input type="number" className="d_form_control" placeholder="1" min="1" value={form.level} onChange={e => setForm({ ...form, level: parseInt(e.target.value) || 1 })} />
          </div>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave}>{editRole ? 'Update Role' : 'Create Role'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default RoleManagement;
