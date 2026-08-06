import React, { useState, useEffect, useMemo } from 'react';
import { PERMISSION_CATEGORIES, SYSTEM_ROLES } from '../../config/rbacConfig';
import { rbacService, facultyService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function PermissionManagement() {
  const [facultyList, setFacultyList] = useState([]);
  const [customRoles, setCustomRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bulk Permission Modal / Actions
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchPerm, setSearchPerm] = useState('');

  const { addToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const facRes = await facultyService.getFaculty();
      if (facRes && facRes.faculty) {
        setFacultyList(facRes.faculty);
      }
      const roleRes = await rbacService.getRoles();
      if (roleRes && roleRes.roles) {
        setCustomRoles(roleRes.roles.filter((r) => !r.isSystem));
      }
    } catch (err) {
      console.error('Error fetching permission matrix data:', err);
    } finally {
      setLoading(false);
    }
  };

  const allRoles = useMemo(() => {
    return [...SYSTEM_ROLES, ...customRoles];
  }, [customRoles]);

  const filteredCategories = useMemo(() => {
    return PERMISSION_CATEGORIES.filter((cat) => {
      if (selectedCategory !== 'All' && cat.name !== selectedCategory) return false;
      return true;
    });
  }, [selectedCategory]);

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">fact_check</span>
            Granular Permission Matrix
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            View permission capabilities across system roles, custom presets, and active faculty overrides.
          </p>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2.5 rounded-full border border-outline-variant/30 bg-surface-container-lowest text-xs font-headings font-bold text-secondary focus:outline-none"
        >
          <option value="All">All Permission Categories</option>
          {PERMISSION_CATEGORIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Permission Matrix Table */}
      {loading ? (
        <div className="p-12 text-center text-xs animate-pulse text-on-surface-variant bg-white rounded-2xl shadow-premium">
          Loading system permission matrix...
        </div>
      ) : (
        <div className="space-y-6">
          {filteredCategories.map((cat) => (
            <div key={cat.name} className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
              <div className="p-4 bg-surface-container-low border-b border-outline-variant/15 flex items-center justify-between">
                <div>
                  <h3 className="font-headings font-extrabold text-sm text-secondary">{cat.name}</h3>
                  <p className="text-[11px] text-on-surface-variant">{cat.description}</p>
                </div>
                <span className="font-mono text-xs font-bold text-primary px-3 py-1 bg-white rounded-full border border-outline-variant/20">
                  {cat.permissions.length} Permissions
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-outline-variant/20 font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-lowest">
                      <th className="py-3 px-4 min-w-[220px]">Permission Name</th>
                      <th className="py-3 px-4 min-w-[150px]">Code Identifier</th>
                      {allRoles.map((r) => (
                        <th key={r.code} className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${r.color === 'rose' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-purple-50 text-purple-800 border-purple-200'}`}>
                            {r.name}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15">
                    {cat.permissions.map((p) => (
                      <tr key={p.code} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-secondary">{p.name}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-primary">{p.code}</td>

                        {allRoles.map((r) => {
                          const isGranted = r.permissions?.includes(p.code);
                          return (
                            <td key={r.code} className="py-3 px-3 text-center">
                              {isGranted ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 shadow-sm" title="Granted">
                                  <span className="material-symbols-outlined text-[16px]">check</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-container text-on-surface-variant/40" title="Not Granted">
                                  <span className="material-symbols-outlined text-[14px]">close</span>
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
