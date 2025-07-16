'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

function WhitelistForm({ onWhitelistAdded }) {
  const [emails, setEmails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

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
      
      alert(`${data.count} email(s) added to the whitelist!`);
      setEmails('');
      onWhitelistAdded(); // Refresh the list
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold font-heading mb-4 text-gray-900">Add to Whitelist</h2>
        {error && <p className="text-red-500 mb-4 font-body">{error}</p>}
        <div className="mb-4">
            <label htmlFor="emails" className="block text-sm font-medium text-gray-700 mb-1 font-body">
                Emails (comma, semicolon, or new-line separated)
            </label>
            <textarea
                id="emails"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                rows="4"
                className="w-full p-2 border border-gray-300 rounded-md text-gray-900 font-body"
                placeholder="email1@example.com, email2@example.com"
                required
            />
        </div>
        <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400 font-body"
        >
            {isSubmitting ? 'Adding...' : 'Add Emails'}
        </button>
    </form>
  );
}

function SyncUsersButton({ onSyncComplete }) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (!confirm('This will add all existing users to the whitelist. This action is for migrating old users and is generally only needed once. Continue?')) {
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
    <div className="mb-6">
      <button 
        onClick={handleSync}
        disabled={isSyncing}
        className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-body"
      >
        {isSyncing ? 'Syncing...' : 'Sync Existing Users'}
      </button>
      <p className="text-sm text-gray-600 mt-2 font-body">
        If you have users who signed up before the whitelist was created, click here to add them to the whitelist with their current roles.
      </p>
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
      const res = await fetch('/api/whitelist');
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
    if (status === 'authenticated' && session.user.role === 'DEVELOPER') {
      fetchWhitelist();
    }
  }, [status, session]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this email from the whitelist?')) return;
    
    try {
        const res = await fetch('/api/whitelist', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error('Failed to delete email.');
        fetchWhitelist(); // Refresh list
    } catch (err) {
        alert(`Error: ${err.message}`);
    }
  };

  if (status === 'loading') {
    return <div className="p-8 text-center text-gray-900 font-body">Loading session...</div>;
  }

  if (status !== 'authenticated' || session.user.role !== 'DEVELOPER') {
    return <div className="p-8 text-center text-red-500 font-body">Access Denied. You must be a developer.</div>;
  }

  return (
    <div className="p-8 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 font-heading text-gray-900">Whitelist Management</h1>
      
      <SyncUsersButton onSyncComplete={fetchWhitelist} />
      <WhitelistForm onWhitelistAdded={fetchWhitelist} />

      {loading && <p className="text-gray-900 font-body">Loading whitelist...</p>}
      {error && <p className="text-red-500 font-body">{error}</p>}
      
      {!loading && !error && (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-body">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-body">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {whitelist.map(item => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-body">{item.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium font-body">
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900 font-body">
                      Delete
                    </button>
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