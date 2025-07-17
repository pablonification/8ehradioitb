'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import ButtonPrimary from '@/app/components/ButtonPrimary';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

export default function PasswordProtectedPage() {
    const params = useParams();
    const { slug } = params;
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!password.trim()) {
            setError('Please enter a password');
            return;
        }
        setLoading(true);
        setError('');
        // Redirect ke API dengan password sebagai query param
        window.location.href = `/api/redirect/${slug}?password=${encodeURIComponent(password)}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-sm p-8">
                    <div className="text-center mb-8">
                        <div className="mx-auto w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                            <FiLock className="w-8 h-8 text-pink-600" />
                        </div>
                        <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">
                            Password Protected
                        </h1>
                        <p className="text-gray-600 font-body">
                            This link is password protected. Please enter the password to continue.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 font-body">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-100 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400 font-body pr-12"
                                    placeholder="Enter password"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                <p className="text-red-600 text-sm font-body">{error}</p>
                            </div>
                        )}

                        <ButtonPrimary 
                            type="submit" 
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? 'Verifying...' : 'Continue'}
                        </ButtonPrimary>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500 font-body">
                            Short URL: 8eh.link/{slug}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
} 