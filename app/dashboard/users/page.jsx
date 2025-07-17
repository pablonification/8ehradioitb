'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const ROLE_OPTIONS = [
  { value: "DEVELOPER", label: "Developer" },
  { value: "TECHNIC", label: "Technic" },
  { value: "REPORTER", label: "Reporter" },
  { value: "KRU", label: "Kru" },
  { value: "MUSIC", label: "Music" },
];

export default function UsersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'authenticated' && session.user.role === 'DEVELOPER') {
      fetchUsers();
    }
  }, [status, session]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!res.ok) {
        throw new Error('Failed to update role');
      }

      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (err) {
      alert(`Error updating role: ${err.message}`);
    }
  };

  if (status === 'loading') {
    return <div className="p-8 text-center">Loading session...</div>;
  }

  if (status === 'unauthenticated' || (status === 'authenticated' && session.user.role !== 'DEVELOPER')) {
    return <div className="p-8 text-center text-red-500">Access Denied. You must be a developer to view this page.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 font-heading text-gray-900">User Management</h1>
      
      {loading && <p>Loading users...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {!loading && !error && (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'DEVELOPER' ? 'bg-red-100 text-red-800' :
                        user.role === 'TECHNIC' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'REPORTER' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md text-gray-900"
                      disabled={user.email === session.user.email} // Disable changing own role
                    >
                      {ROLE_OPTIONS.map(role => (
                        <option key={role.value} value={role.value} style={{ fontFamily: 'var(--font-body), ui-sans-serif, system-ui, sans-serif' }} className="text-gray-900">{role.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 