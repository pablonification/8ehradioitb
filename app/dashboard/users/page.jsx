'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { hasRole, splitRoles } from '@/lib/roleUtils';
import Image from 'next/image';

// Base roles
const BASE_ROLES = ["DEVELOPER", "TECHNIC", "REPORTER", "KRU", "MUSIC"];

// Helper to generate combinations of roles
function generateRoleCombinations(baseRoles) {
  const combos = [];
  const n = baseRoles.length;
  // Use bitmask to generate all non-empty combinations
  for (let mask = 1; mask < 1 << n; mask++) {
    const selected = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) selected.push(baseRoles[i]);
    }
    const value = selected.join('-');
    const label = selected.map(r => r.charAt(0) + r.slice(1).toLowerCase()).join(' + ');
    combos.push({ value, label });
  }
  return combos;
}

const ROLE_OPTIONS = generateRoleCombinations(BASE_ROLES);

const getRoleClass = (roleString) => {
    if (!roleString) return 'bg-gray-100 text-gray-800';
    const primary = roleString.split('-')[0];
    switch (primary) {
        case 'DEVELOPER': return 'bg-red-100 text-red-800';
        case 'TECHNIC': return 'bg-blue-100 text-blue-800';
        case 'REPORTER': return 'bg-green-100 text-green-800';
        case 'MUSIC': return 'bg-purple-100 text-purple-800';
        case 'KRU':
        default: return 'bg-gray-100 text-gray-800';
    }
};

export default function UsersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState([]);
  const [editingMap, setEditingMap] = useState({}); // { userId: string[] }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'authenticated' && hasRole(session.user.role, 'DEVELOPER')) {
      fetchUsers();
    }
  }, [status, session]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleLocalRole = (userId, baseRole) => {
    setEditingMap(prev => {
      const current = prev[userId] || splitRoles(users.find(u => u.id === userId)?.role || '');
      let updated;
      if (current.includes(baseRole)) {
        if (current.length === 1) return prev; // must have at least 1
        updated = current.filter(r => r !== baseRole);
      } else {
        updated = [...current, baseRole];
      }
      // Sort
      const sorted = BASE_ROLES.filter(r => updated.includes(r));
      return { ...prev, [userId]: sorted };
    });
  };

  const startEdit = (userId) => {
    setEditingMap(prev => ({ ...prev, [userId]: splitRoles(users.find(u => u.id === userId)?.role || '') }));
  };

  const cancelEdit = (userId) => {
    setEditingMap(prev => {
      const { [userId]: omit, ...rest } = prev;
      return rest;
    });
  };

  const saveEdit = async (userId) => {
    const rolesArr = editingMap[userId];
    if (!rolesArr || rolesArr.length === 0) return;
    const newRoleString = rolesArr.join('-');
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRoleString }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRoleString } : u));
      cancelEdit(userId);
    } catch (err) {
      alert(`Error updating role: ${err.message}`);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="p-8 text-center font-body">Loading...</div>;
  }

  if (status === 'unauthenticated' || (status === 'authenticated' && !hasRole(session.user.role, 'DEVELOPER'))) {
    return <div className="p-8 text-center text-red-500 font-body">Access Denied. You must be a developer to view this page.</div>;
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl font-heading font-bold mb-6 text-gray-900">User Management</h1>
      
      {error && <p className="text-red-500 font-body mb-4">{error}</p>}
      
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-body">User</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-body">Roles</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-body">Assign</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <Image
                        className="h-10 w-10 rounded-full"
                        src={user.image || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                        alt={user.name}
                        width={40}
                        height={40}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 font-heading">{user.name}</div>
                      <div className="text-sm text-gray-500 font-body">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   {(editingMap[user.id] || splitRoles(user.role)).map(r => (
                      <span key={r} className={`px-2 mr-1 mb-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleClass(r)}`}>{r}</span>
                    ))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                   {editingMap[user.id] ? (
                     <>
                       <div className="flex flex-wrap gap-1 mb-2">
                         {BASE_ROLES.map(base => {
                           const active = editingMap[user.id].includes(base);
                           return (
                             <button key={base} onClick={() => toggleLocalRole(user.id, base)} className={`px-2 py-1 rounded-full text-xs font-semibold border ${active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-600'}`}>{base}</button>
                           );
                         })}
                       </div>
                       <button onClick={() => saveEdit(user.id)} className="mr-2 text-green-600 hover:underline">Save</button>
                       <button onClick={() => cancelEdit(user.id)} className="text-gray-600 hover:underline">Cancel</button>
                     </>
                   ) : (
                     <button onClick={() => startEdit(user.id)} disabled={user.email === session.user.email} className="text-blue-600 hover:underline disabled:opacity-50">Edit</button>
                   )}
                  </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}