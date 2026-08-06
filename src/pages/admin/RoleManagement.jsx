import React, { useState, useEffect, useMemo } from 'react';
import { SYSTEM_ROLES, PERMISSION_CATEGORIES, PERMISSIONS } from '../../config/rbacConfig';
import { rbacService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/admin/Modal';
import ConfirmModal from '../../components/admin/ConfirmModal';

export default function RoleManagement() {
  const [customRoles, setCustomRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);

  // New / Edit Role Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    code: '',
    badge: '',
    color: 'purple',
    description: '',
    permissions: [],
  });
  const [saving, setSaving] = useState(false);

  // Delete Confirm Modal State
  const [deleteRoleTarget, setDeleteRoleTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    fetchRoles();
    const handleUpdate = () => fetchRoles();
    window.addEventListener('saumyaa_data_updated', handleUpdate);
    return () => window.removeEventListener('saumyaa_data_updated', handleUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await rbacService.getRoles();
      if (res && res.roles) {
        setCustomRoles(res.roles.filter((r) => !r.isSystem));
      }
    } catch (err) {
      console.error('Error fetching custom roles:', err);
    } finally {
      setLoading(false);
    }
  };

  // Combine System Roles + Custom Roles
  const allRoles = useMemo(() => {
    return [...SYSTEM_ROLES, ...customRoles];
  }, [customRoles]);

  const handleOpenAddRole = () => {
    setEditingRole(null);
    setRoleForm({
      name: '',
      code: '',
      badge: '',
      color: 'purple',
      description: '',
      permissions: [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_ASSIGNED_CLASSES],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name || '',
      code: role.code || '',
      badge: role.badge || '',
      color: role.color || 'purple',
      description: role.description || '',
      permissions: role.permissions || [],
    });
    setIsModalOpen(true);
  };

  const handleTogglePermissionInForm = (permCode) => {
    setRoleForm((prev) => {
      const exists = prev.permissions.includes(permCode);
      const updated = exists
        ? prev.permissions.filter((p) => p !== permCode)
        : [...prev.permissions, permCode];
      return { ...prev, permissions: updated };
    });
  };

  const handleToggleCategoryInForm = (categoryPermissions = [], selectAll = true) => {
    const permCodes = categoryPermissions.map((p) => p.code);
    setRoleForm((prev) => {
      let updated = [...prev.permissions];
      if (selectAll) {
        permCodes.forEach((code) => {
          if (!updated.includes(code)) updated.push(code);
        });
      } else {
        updated = updated.filter((code) => !permCodes.includes(code));
      }
      return { ...prev, permissions: updated };
    });
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      addToast('Please enter a role name!', 'warning');
      return;
    }
    if (!roleForm.code.trim()) {
      addToast('Please enter a unique role code (e.g. LAB_INCHARGE)!', 'warning');
      return;
    }

    setSaving(true);
    try {
      if (editingRole) {
        await rbacService.updateRole(editingRole._id || editingRole.id, roleForm);
        addToast(`Updated role "${roleForm.name}" permissions!`, 'success');
      } else {
        await rbacService.createRole(roleForm);
        addToast(`Created custom role "${roleForm.name}" successfully!`, 'success');
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (err) {
      addToast(err.message || 'Failed to save role', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteRoleTarget) return;
    setDeleting(true);
    try {
      await rbacService.deleteRole(deleteRoleTarget._id || deleteRoleTarget.id);
      addToast(`Deleted custom role "${deleteRoleTarget.name}"`, 'success');
      setDeleteRoleTarget(null);
      fetchRoles();
    } catch (err) {
      addToast(err.message || 'Failed to delete role', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const getRoleBadgeStyle = (color) => {
    switch (color) {
      case 'rose':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'amber':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'emerald':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'blue':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-purple-100 text-purple-800 border-purple-300';
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">admin_panel_settings</span>
            Role-Based Access Control (RBAC) Management
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            System &amp; Custom Role Definitions, Permission Rules, and Hierarchy Matrix.
          </p>
        </div>

        <button
          onClick={handleOpenAddRole}
          className="bg-primary text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-2 shadow-premium hover:shadow-glow-primary active:scale-95 shadow-tactile-btn transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add_moderator</span>
          Create Custom Role
        </button>
      </div>

      {/* Roles Grid Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allRoles.map((role) => {
          const permCount = role.permissions ? role.permissions.length : 0;
          return (
            <div
              key={role.id || role.code}
              className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15 flex flex-col justify-between space-y-4 hover:shadow-xl transition-all relative overflow-hidden group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-headings font-bold border ${getRoleBadgeStyle(role.color)} shadow-sm`}>
                    {role.badge || role.name}
                  </span>

                  {role.isSystem ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-container font-mono font-bold text-[10px] text-on-surface-variant">
                      🔒 System Default
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-mono font-bold text-[10px] border border-emerald-200">
                      ⚡ Custom Role
                    </span>
                  )}
                </div>

                <h3 className="font-headings font-extrabold text-lg text-secondary group-hover:text-primary transition-colors">
                  {role.name}
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed min-h-[36px]">
                  {role.description || 'Custom defined organizational role with customized access rights.'}
                </p>
              </div>

              <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-primary">
                  {permCount} Permissions Granted
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedRole(role)}
                    className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-secondary text-xs font-headings font-bold transition-colors cursor-pointer"
                  >
                    View Permissions
                  </button>

                  {!role.isSystem && (
                    <>
                      <button
                        onClick={() => handleOpenEditRole(role)}
                        className="p-1.5 rounded-xl text-primary hover:bg-primary/10 transition-colors"
                        title="Edit Permissions"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteRoleTarget(role)}
                        className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Role"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Details / Permission View Modal */}
      {selectedRole && (
        <Modal
          isOpen={Boolean(selectedRole)}
          onClose={() => setSelectedRole(null)}
          title={`Role Details: ${selectedRole.name}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-5 font-body text-xs">
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15 flex items-center justify-between">
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-headings font-bold border ${getRoleBadgeStyle(selectedRole.color)}`}>
                  {selectedRole.badge || selectedRole.name}
                </span>
                <h4 className="font-headings font-bold text-sm text-secondary mt-2">
                  {selectedRole.name} ({selectedRole.code})
                </h4>
                <p className="text-xs text-on-surface-variant mt-0.5">{selectedRole.description}</p>
              </div>
              <span className="font-mono text-xs font-bold text-primary px-3 py-1 bg-primary/10 rounded-full">
                {selectedRole.permissions?.length || 0} Total Permissions
              </span>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              <h4 className="font-headings font-bold text-xs text-secondary uppercase tracking-wider">
                Granted Permission Matrix:
              </h4>

              {PERMISSION_CATEGORIES.map((cat) => {
                const grantedInCat = cat.permissions.filter((p) =>
                  selectedRole.permissions?.includes(p.code)
                );
                if (grantedInCat.length === 0) return null;

                return (
                  <div key={cat.name} className="p-3.5 rounded-xl border border-outline-variant/15 bg-white space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-headings font-bold text-secondary">{cat.name}</span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {grantedInCat.length} / {cat.permissions.length} Enabled
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {grantedInCat.map((p) => (
                        <div key={p.code} className="flex items-center gap-1.5 text-emerald-800 font-medium">
                          <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                          {p.name}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-outline-variant/15 flex justify-end">
              <button
                onClick={() => setSelectedRole(null)}
                className="px-5 py-2 rounded-full bg-secondary text-white font-headings font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create / Edit Role Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingRole ? `Edit Role Permissions: ${editingRole.name}` : 'Create Custom RBAC Role'}
          maxWidth="max-w-4xl"
        >
          <form onSubmit={handleSaveRole} className="space-y-5 text-xs font-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="font-headings font-bold text-on-surface-variant block mb-1">
                  Role Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Examination Incharge"
                  value={roleForm.name}
                  onChange={(e) =>
                    setRoleForm({
                      ...roleForm,
                      name: e.target.value,
                      code: roleForm.code || e.target.value.toUpperCase().replace(/ /g, '_'),
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-secondary font-bold"
                />
              </div>

              <div>
                <label className="font-headings font-bold text-on-surface-variant block mb-1">
                  Role Unique Code *
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingRole)}
                  placeholder="e.g. EXAM_INCHARGE"
                  value={roleForm.code}
                  onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-mono font-bold focus:outline-none focus:border-secondary disabled:opacity-60"
                />
              </div>

              <div>
                <label className="font-headings font-bold text-on-surface-variant block mb-1">
                  Badge Color
                </label>
                <select
                  value={roleForm.color}
                  onChange={(e) => setRoleForm({ ...roleForm, color: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-secondary font-bold"
                >
                  <option value="purple">Purple</option>
                  <option value="blue">Blue</option>
                  <option value="emerald">Emerald Green</option>
                  <option value="amber">Amber Gold</option>
                  <option value="rose">Rose Red</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-headings font-bold text-on-surface-variant block mb-1">
                Role Description &amp; Scope
              </label>
              <input
                type="text"
                placeholder="Briefly describe the responsibilities and scope of this role..."
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-secondary"
              />
            </div>

            {/* Granular Permission Checkboxes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-headings font-bold text-xs text-secondary uppercase tracking-wider">
                  Configure Granular Permissions ({roleForm.permissions.length} Selected):
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRoleForm({ ...roleForm, permissions: Object.values(PERMISSIONS) })}
                    className="text-[11px] font-bold text-primary hover:underline"
                  >
                    Select All
                  </button>
                  <span>&bull;</span>
                  <button
                    type="button"
                    onClick={() => setRoleForm({ ...roleForm, permissions: [] })}
                    className="text-[11px] font-bold text-rose-600 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2">
                {PERMISSION_CATEGORIES.map((cat) => {
                  const allSelected = cat.permissions.every((p) => roleForm.permissions.includes(p.code));
                  return (
                    <div key={cat.name} className="p-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest space-y-3">
                      <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2">
                        <div>
                          <h5 className="font-headings font-bold text-xs text-secondary">{cat.name}</h5>
                          <p className="text-[10px] text-on-surface-variant">{cat.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleCategoryInForm(cat.permissions, !allSelected)}
                          className="text-[11px] font-bold text-primary hover:underline"
                        >
                          {allSelected ? 'Uncheck Category' : 'Check Category'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {cat.permissions.map((p) => {
                          const isChecked = roleForm.permissions.includes(p.code);
                          return (
                            <label
                              key={p.code}
                              className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer select-none ${
                                isChecked
                                  ? 'bg-primary/10 border-primary/40 text-secondary font-bold'
                                  : 'bg-white border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-low'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePermissionInForm(p.code)}
                                className="w-4 h-4 rounded text-primary focus:ring-primary"
                              />
                              <span className="text-[11px]">{p.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/15 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-full border border-outline-variant/30 text-xs font-headings font-bold hover:bg-surface-container-low"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 rounded-full bg-primary text-white text-xs font-headings font-bold hover:bg-primary-container transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving Role...' : editingRole ? 'Update Role Permissions' : 'Save & Create Role'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteRoleTarget)}
        onClose={() => setDeleteRoleTarget(null)}
        onConfirm={handleDeleteRole}
        loading={deleting}
        title="Delete Custom Role"
        message={`Are you sure you want to delete custom role "${deleteRoleTarget?.name}"? Faculty members with this role will revert to common permissions.`}
        confirmText="Delete Role"
      />
    </div>
  );
}
