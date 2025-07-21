'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { hasRole } from '@/lib/roleUtils';
import { FiPlus, FiRefreshCw, FiTrash2 } from 'react-icons/fi';

function WhitelistForm({ onWhitelistAdded }) {
  const [emails, setEmails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const emailList = emails.split(/[\n,;]+/).map(email => email.trim()).filter(Boolean);
    if (emailList.length === 0) {
      setError("Please enter at least one email.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: emailList }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add emails.');
      }
      
      setSuccess(`${data.count} email(s) added successfully!`);
      setEmails('');
      onWhitelistAdded(); // Refresh the list
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded-xl shadow-md">
        <h2 className="text-xl font-bold font-heading mb-4 text-gray-800">Add to Whitelist</h2>
        {error && <p className="text-red-500 mb-4 font-body text-sm p-3 bg-red-50 rounded-md">{error}</p>}
        {success && <p className="text-green-600 mb-4 font-body text-sm p-3 bg-green-50 rounded-md">{success}</p>}
        <div className="mb-4">
            <label htmlFor="emails" className="block text-sm font-medium text-gray-700 mb-2 font-body">
                Emails (comma, semicolon, or new-line separated)
            </label>
            <textarea
                id="emails"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-md text-gray-900 font-body focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                placeholder="email1@example.com, email2@example.com"
                required
            />
        </div>
        <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400 font-body cursor-pointer transition-colors"
        >
            <FiPlus />
            {isSubmitting ? 'Adding...' : 'Add Emails'}
        </button>
    </form>
  );
}

function SyncUsersButton({ onSyncComplete }) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (!confirm('This will add all existing app users to the whitelist. Are you sure you want to continue?')) {
      return;
    }
    
    setIsSyncing(true);
    try {
      const res = await fetch('/api/whitelist/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Sync failed');
      }
      alert(data.message);
      onSyncComplete();
    } catch (err) {
      alert(`Error syncing users: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold font-heading mb-2 text-gray-800">Sync Existing Users</h2>
      <p className="text-sm text-gray-600 mb-4 font-body">
        For migrating old users, click here to add them all to the whitelist automatically.
      </p>
      <button 
        onClick={handleSync}
        disabled={isSyncing}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-body cursor-pointer transition-colors"
      >
        <FiRefreshCw className={isSyncing ? 'animate-spin' : ''}/>
        {isSyncing ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  );
}

export default function WhitelistPage() {
  const { data: session, status } = useSession();
  const [whitelist, setWhitelist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWhitelist = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whitelist', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (!res.ok) throw new Error('Failed to fetch whitelist.');
      const data = await res.json();
      setWhitelist(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && hasRole(session.user.role, 'DEVELOPER')) {
      fetchWhitelist();
    }
  }, [status, session]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this email from the whitelist?')) return;
    
    try {
        await fetch('/api/whitelist', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        fetchWhitelist(); // Refresh list
    } catch (err) {
        alert(`Error: ${err.message}`);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="p-8 text-center font-body">Loading...</div>;
  }

  if (status !== 'authenticated' || !hasRole(session.user.role, 'DEVELOPER')) {
    return <div className="p-8 text-center text-red-500 font-body">Access Denied. You must be a developer.</div>;
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl font-heading font-bold mb-6 text-gray-900">Whitelist Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column for Actions */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <WhitelistForm onWhitelistAdded={fetchWhitelist} />
          <SyncUsersButton onSyncComplete={fetchWhitelist} />
        </div>
        
        {/* Right Column for Table */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-body">Whitelisted Email</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {whitelist.length > 0 ? whitelist.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-body">{item.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-full cursor-pointer transition-colors" title="Delete">
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                )) : (
                    <tr>
                        <td colSpan="2" className="text-center py-10 text-gray-500 font-body">
                            No emails have been whitelisted yet.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}