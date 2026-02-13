'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { hasRole, splitRoles } from '@/lib/roleUtils'
import Image from 'next/image'

interface UserRow {
  id: string
  name: string
  email: string
  image: string | null
  role: string
}

type UsersApiResponse = UserRow[]

interface UpdateUserRolePayload {
  userId: string
  role: string
}

interface RoleOption {
  value: string
  label: string
}

const BASE_ROLES = ['DEVELOPER', 'TECHNIC', 'REPORTER', 'KRU', 'MUSIC'] as const
type BaseRole = (typeof BASE_ROLES)[number]
type RolesByUser = Partial<Record<string, string[]>>

// Helper to generate combinations of roles
function generateRoleCombinations(baseRoles: readonly string[]): RoleOption[] {
  const combos: RoleOption[] = []
  const n = baseRoles.length
  // Use bitmask to generate all non-empty combinations
  for (let mask = 1; mask < 1 << n; mask++) {
    const selected: string[] = []
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) selected.push(baseRoles[i])
    }
    const value = selected.join('-')
    const label = selected.map((r) => r.charAt(0) + r.slice(1).toLowerCase()).join(' + ')
    combos.push({ value, label })
  }
  return combos
}

const ROLE_OPTIONS = generateRoleCombinations(BASE_ROLES)

const getRoleClass = (roleString: string): string => {
  if (!roleString) return 'bg-gray-100 text-gray-800'
  const primary = roleString.split('-')[0]
  switch (primary) {
    case 'DEVELOPER':
      return 'bg-red-100 text-red-800'
    case 'TECHNIC':
      return 'bg-blue-100 text-blue-800'
    case 'REPORTER':
      return 'bg-green-100 text-green-800'
    case 'MUSIC':
      return 'bg-purple-100 text-purple-800'
    case 'KRU':
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<UserRow[]>([])
  const [editingMap, setEditingMap] = useState<RolesByUser>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sessionRole = session?.user?.role ?? ''
  const isDeveloper = status === 'authenticated' && hasRole(sessionRole, 'DEVELOPER')

  useEffect(() => {
    if (isDeveloper) {
      fetchUsers()
    }
  }, [isDeveloper])

  const fetchUsers = async (): Promise<void> => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      const data: UsersApiResponse = await res.json()
      setUsers(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const toggleLocalRole = (userId: string, baseRole: BaseRole): void => {
    setEditingMap((prev) => {
      const current = prev[userId] ?? splitRoles(users.find((u) => u.id === userId)?.role ?? '')
      let updated: string[]
      if (current.includes(baseRole)) {
        if (current.length === 1) return prev // must have at least 1
        updated = current.filter((r) => r !== baseRole)
      } else {
        updated = [...current, baseRole]
      }
      // Sort
      const sorted = BASE_ROLES.filter((r) => updated.includes(r))
      return { ...prev, [userId]: sorted }
    })
  }

  const startEdit = (userId: string): void => {
    setEditingMap((prev) => ({
      ...prev,
      [userId]: splitRoles(users.find((u) => u.id === userId)?.role ?? ''),
    }))
  }

  const cancelEdit = (userId: string): void => {
    setEditingMap((prev) => {
      const next = { ...prev }
      delete next[userId]
      return next
    })
  }

  const saveEdit = async (userId: string): Promise<void> => {
    const rolesArr = editingMap[userId]
    if (!rolesArr || rolesArr.length === 0) return
    const newRoleString = rolesArr.join('-')
    try {
      const payload: UpdateUserRolePayload = { userId, role: newRoleString }
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to update role')
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRoleString } : u)))
      cancelEdit(userId)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      alert(`Error updating role: ${message}`)
    }
  }

  if (status === 'loading' || loading) {
    return <div className="font-body p-8 text-center">Loading...</div>
  }

  if (status === 'unauthenticated' || (status === 'authenticated' && !isDeveloper)) {
    return (
      <div className="font-body p-8 text-center text-red-500">
        Access Denied. You must be a developer to view this page.
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="font-heading mb-6 text-3xl font-bold text-gray-900">User Management</h1>

      {error && <p className="font-body mb-4 text-red-500">{error}</p>}

      <div className="w-full overflow-x-auto rounded-lg bg-white shadow-md">
        <table className="w-full min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="font-body px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6"
              >
                User
              </th>
              <th
                scope="col"
                className="font-body px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6"
              >
                Roles
              </th>
              <th
                scope="col"
                className="font-body px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6"
              >
                Assign
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((user) => {
              const localRoles = editingMap[user.id]

              return (
                <tr key={user.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap sm:px-6">
                    <div className="flex items-center">
                      <div className="h-8 w-8 flex-shrink-0 sm:h-10 sm:w-10">
                        <Image
                          className="h-8 w-8 rounded-full sm:h-10 sm:w-10"
                          src={
                            user.image ||
                            `https://ui-avatars.com/api/?name=${user.name}&background=random`
                          }
                          alt={user.name}
                          width={40}
                          height={40}
                        />
                      </div>
                      <div className="ml-3 min-w-0 flex-1 sm:ml-4">
                        <div className="font-heading truncate text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="font-body truncate text-xs text-gray-500 sm:text-sm">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap sm:px-6">
                    <div className="flex flex-wrap gap-1">
                      {(localRoles ?? splitRoles(user.role)).map((r) => (
                        <span
                          key={r}
                          className={`inline-flex rounded-full px-2 py-1 text-xs leading-4 font-semibold ${getRoleClass(r)}`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium whitespace-nowrap sm:px-6">
                    {localRoles ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {BASE_ROLES.map((base) => {
                            const active = localRoles.includes(base)
                            return (
                              <button
                                key={base}
                                onClick={() => toggleLocalRole(user.id, base)}
                                className={`rounded-full border px-2 py-1 text-xs font-semibold ${active ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-600'}`}
                              >
                                {base}
                              </button>
                            )
                          })}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(user.id)}
                            className="text-sm text-green-600 hover:underline"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => cancelEdit(user.id)}
                            className="text-sm text-gray-600 hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(user.id)}
                        disabled={user.email === session?.user?.email}
                        className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
