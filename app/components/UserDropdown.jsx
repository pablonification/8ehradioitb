// app/components/UserDropdown.jsx
'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';

export default function UserDropdown() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);

    if (!session?.user) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2"
            >
                <Image
                    src={session.user.image || '/default-avatar.png'}
                    alt={session.user.name || 'User'}
                    width={32}
                    height={32}
                    className="rounded-full"
                />
                <span className="font-body text-sm text-gray-800">{session.user.name}</span>
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-body"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
} 