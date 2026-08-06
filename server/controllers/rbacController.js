const Role = require('../models/Role');
const Permission = require('../models/Permission');
const ActivityLog = require('../models/ActivityLog');
const LoginHistory = require('../models/LoginHistory');
const Faculty = require('../models/Faculty');

// GET all system & custom roles
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ isSystem: -1, createdAt: 1 });
    res.json({ success: true, roles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE new custom role
exports.createRole = async (req, res) => {
  try {
    const { name, code, badge, color, description, permissions } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Role name and code are required' });
    }

    const existing = await Role.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Role code ${code} already exists` });
    }

    const newRole = await Role.create({
      code: code.toUpperCase(),
      name,
      badge: badge || `🎓 ${name}`,
      color: color || 'purple',
      description: description || '',
      isSystem: false,
      permissions: Array.isArray(permissions) ? permissions : [],
    });

    await ActivityLog.create({
      userId: req.user?._id || 'admin',
      userName: req.user?.name || 'Admin',
      userRole: 'SuperAdmin',
      action: 'ROLE_CREATED',
      category: 'RBAC',
      details: `Created new custom role: ${name} (${code})`,
      status: 'SUCCESS',
    });

    res.json({ success: true, role: newRole, message: 'Custom role created successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE role permissions
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, badge, color, description, permissions } = req.body;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (name) role.name = name;
    if (badge) role.badge = badge;
    if (color) role.color = color;
    if (description !== undefined) role.description = description;
    if (Array.isArray(permissions)) role.permissions = permissions;

    await role.save();

    await ActivityLog.create({
      userId: req.user?._id || 'admin',
      userName: req.user?.name || 'Admin',
      userRole: 'SuperAdmin',
      action: 'ROLE_UPDATED',
      category: 'RBAC',
      details: `Updated role: ${role.name} (${role.permissions.length} permissions)`,
      status: 'SUCCESS',
    });

    res.json({ success: true, role, message: 'Role updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE custom role
exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (role.isSystem) {
      return res.status(400).json({ success: false, message: 'System default roles cannot be deleted' });
    }

    await Role.findByIdAndDelete(id);

    await ActivityLog.create({
      userId: req.user?._id || 'admin',
      userName: req.user?.name || 'Admin',
      userRole: 'SuperAdmin',
      action: 'ROLE_DELETED',
      category: 'RBAC',
      details: `Deleted custom role: ${role.name}`,
      status: 'SUCCESS',
    });

    res.json({ success: true, message: 'Role deleted successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ASSIGN roles to faculty member
exports.assignFacultyRoles = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { roles, permissionOverrides, status } = req.body;

    let faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      faculty = await Faculty.findOne({ $or: [{ id: facultyId }, { email: req.body.email }] });
    }

    if (faculty) {
      if (Array.isArray(roles)) faculty.roles = roles;
      if (permissionOverrides) faculty.permissionOverrides = permissionOverrides;
      if (status) faculty.is_active = status === 'Active';
      await faculty.save();
    }

    await ActivityLog.create({
      userId: req.user?._id || 'admin',
      userName: req.user?.name || 'Admin',
      userRole: 'SuperAdmin',
      action: 'FACULTY_ROLES_ASSIGNED',
      category: 'RBAC',
      details: `Assigned roles [${Array.isArray(roles) ? roles.join(', ') : ''}] to ${faculty?.name || facultyId}`,
      status: 'SUCCESS',
    }).catch(() => {});

    res.json({ success: true, faculty, message: `Roles updated successfully!` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET Activity Logs
exports.getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE Activity Log entry
exports.logActivity = async (req, res) => {
  try {
    const { action, category, details, status } = req.body;
    const log = await ActivityLog.create({
      userId: req.user?._id || req.user?.id || 'unknown',
      userName: req.user?.name || req.user?.fullName || 'User',
      userRole: req.user?.role || 'Faculty',
      action: action || 'USER_ACTION',
      category: category || 'GENERAL',
      details: details || '',
      status: status || 'SUCCESS',
      ipAddress: req.ip || '127.0.0.1',
    });
    res.json({ success: true, log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET Login History
exports.getLoginHistory = async (req, res) => {
  try {
    const history = await LoginHistory.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
