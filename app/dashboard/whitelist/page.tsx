'use client'

import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import { useSession } from 'next-auth/react'
import { hasRole } from '@/lib/roleUtils'
import { FiPlus, FiRefreshCw, FiTrash2 } from 'react-icons/fi'

interface WhitelistEntry {
  id: number | string
  email: string
}

interface WhitelistFormProps {
  onWhitelistAdded: () => void
}

interface SyncUsersButtonProps {
  onSyncComplete: () => void
}

interface AddWhitelistResponse {
  count: number
  error?: string
}

interface SyncUsersResponse {
  message: string
  error?: string
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

function WhitelistForm({ onWhitelistAdded }: WhitelistFormProps) {
  const [emails, setEmails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    const emailList = emails
      .split(/[\n,;]+/)
      .map((email) => email.trim())
      .filter(Boolean)
    if (emailList.length === 0) {
      setError('Please enter at least one email.')
      setIsSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: emailList }),
      })

      const data: AddWhitelistResponse = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add emails.')
      }

      setSuccess(`${data.count} email(s) added successfully!`)
      setEmails('')
      onWhitelistAdded() // Refresh the list
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to add emails.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-md">
      <h2 className="font-heading mb-4 text-xl font-bold text-gray-800">Add to Whitelist</h2>
      {error && (
        <p className="font-body mb-4 rounded-md bg-red-50 p-3 text-sm text-red-500">{error}</p>
      )}
      {success && (
        <p className="font-body mb-4 rounded-md bg-green-50 p-3 text-sm text-green-600">
          {success}
        </p>
      )}
      <div className="mb-4">
        <label htmlFor="emails" className="font-body mb-2 block text-sm font-medium text-gray-700">
          Emails (comma, semicolon, or new-line separated)
        </label>
        <textarea
          id="emails"
          value={emails}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEmails(e.target.value)}
          rows={4}
          className="font-body w-full rounded-md border border-gray-300 p-3 text-gray-900 transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-500"
          placeholder="email1@example.com, email2@example.com"
          required
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="font-body flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-red-700 disabled:bg-gray-400"
      >
        <FiPlus />
        {isSubmitting ? 'Adding...' : 'Add Emails'}
      </button>
    </form>
  )
}

function SyncUsersButton({ onSyncComplete }: SyncUsersButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    if (
      !confirm(
        'This will add all existing app users to the whitelist. Are you sure you want to continue?'
      )
    ) {
      return
    }

    setIsSyncing(true)
    try {
      const res = await fetch('/api/whitelist/sync', { method: 'POST' })
      const data: SyncUsersResponse = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Sync failed')
      }
      alert(data.message)
      onSyncComplete()
    } catch (err: unknown) {
      alert(`Error syncing users: ${getErrorMessage(err, 'Unknown error')}`)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      <h2 className="font-heading mb-2 text-xl font-bold text-gray-800">Sync Existing Users</h2>
      <p className="font-body mb-4 text-sm text-gray-600">
        For migrating old users, click here to add them all to the whitelist automatically.
      </p>
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="font-body flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
      >
        <FiRefreshCw className={isSyncing ? 'animate-spin' : ''} />
        {isSyncing ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  )
}

export default function WhitelistPage() {
  const { data: session, status } = useSession()
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWhitelist = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/whitelist')
      if (!res.ok) throw new Error('Failed to fetch whitelist.')
      const data: WhitelistEntry[] = await res.json()
      setWhitelist(data)
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch whitelist.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && hasRole(session.user.role, 'DEVELOPER')) {
      fetchWhitelist()
    }
  }, [status, session])

  const handleDelete = async (id: WhitelistEntry['id']) => {
    if (!confirm('Are you sure you want to remove this email from the whitelist?')) return

    try {
      await fetch('/api/whitelist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      fetchWhitelist() // Refresh list
    } catch (err: unknown) {
      alert(`Error: ${getErrorMessage(err, 'Unknown error')}`)
    }
  }

  if (status === 'loading' || loading) {
    return <div className="font-body p-8 text-center">Loading...</div>
  }

  if (status !== 'authenticated' || !hasRole(session.user.role, 'DEVELOPER')) {
    return (
      <div className="font-body p-8 text-center text-red-500">
        Access Denied. You must be a developer.
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="font-heading mb-6 text-3xl font-bold text-gray-900">Whitelist Management</h1>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        {/* Left Column for Actions */}
        <div className="flex flex-col gap-8 lg:col-span-1">
          <WhitelistForm onWhitelistAdded={fetchWhitelist} />
          <SyncUsersButton onSyncComplete={fetchWhitelist} />
        </div>

        {/* Right Column for Table */}
        <div className="lg:col-span-2">
          <div className="overflow-x-auto rounded-lg bg-white shadow-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="font-body px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                  >
                    Whitelisted Email
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {whitelist.length > 0 ? (
                  whitelist.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-gray-50">
                      <td className="font-body px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                        {item.email}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="cursor-pointer rounded-full p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-900"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="font-body py-10 text-center text-gray-500">
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
  )
}
