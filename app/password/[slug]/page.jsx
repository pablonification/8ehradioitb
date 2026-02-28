"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import ButtonPrimary from "@/app/components/ButtonPrimary";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";

export default function PasswordProtectedPage() {
  const params = useParams();
  const { slug } = params;
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter a password");
      return;
    }
    setLoading(true);
    setError("");
    // Redirect ke API dengan password sebagai query param
    window.location.href = `/api/redirect/${slug}?password=${encodeURIComponent(password)}`;
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fbf7ed_0%,#f3efe5_55%,#eee8dc_100%)] flex flex-col font-body">
      {/* Navbar */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-6 py-3">
        <div className="mx-auto max-w-5xl">
          <Image src="/8eh-real-long.png" alt="8EH Radio ITB" width={140} height={36} className="h-8 w-auto object-contain" priority />
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-lg w-full">
          {/* Card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="h-1.5 bg-[#f97316]" />
            <div className="p-8 space-y-4">
              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <FiLock className="w-8 h-8 text-[#f97316]" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2 font-heading">
                  Password Protected
                </h1>
                <p className="text-gray-600">
                  This link is password protected. Please enter the password to
                  continue.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-6 text-gray-900"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-body">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 font-body pr-12"
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
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <ButtonPrimary type="submit" disabled={loading} className="w-full font-body">
                  {loading ? "Verifying..." : "Continue"}
                </ButtonPrimary>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-xs text-slate-500 font-body text-center py-4">
        © {new Date().getFullYear()} Technic 8EH Radio ITB. All rights reserved.
      </footer>
    </div>
  );
}
