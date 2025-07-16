'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import ButtonPrimary from "./ButtonPrimary";
import { useState } from 'react';

// Icons
const HomeIcon = () => <Image src="/home.svg" alt="Home" width={24} height={24} />;
const BlogIcon = () => <Image src="/blog.svg" alt="Blog" width={24} height={24} />;
const PodcastIcon = () => <Image src="/podcast.svg" alt="Podcast" width={24} height={24} />;
const LinkIcon = () => <Image src="/link.svg" alt="Links" width={24} height={24} />;
const LogoutIcon = () => <Image src="/log-out.svg" alt="Logout" width={24} height={24} />;

const CollapseIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 8L6 12M6 12L10 16M6 12H18M5 20H19C20.1046 20 21 19.1046 21 18V6C21 4.89543 20.1046 4 19 4H5C3.89543 4 3 4.89543 3 6V18C3 19.1046 3.89543 20 5 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const ExpandIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 16L18 12M18 12L14 8M18 12H6M5 20H19C20.1046 20 21 19.1046 21 18V6C21 4.89543 20.1046 4 19 4H5C3.89543 4 3 4.89543 3 6V18C3 19.1046 3.89543 20 5 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const navItems = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/dashboard/blog", label: "Blog", icon: BlogIcon },
  { href: "/dashboard/podcast", label: "Podcast", icon: PodcastIcon },
  { href: "/dashboard/links", label: "Links", icon: LinkIcon },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <aside className={`h-screen flex flex-col bg-[#FBEAEA] shadow-sm transition-all duration-300 ease-in-out ${isExpanded ? 'w-56' : 'w-24'}`}>
      <div className="flex items-center justify-center py-3">
        <Link href="/dashboard">
          <Image src="/8eh.png" alt="8EH Logo" width={60} height={60} />
        </Link>
      </div>

      <div className={`px-4 mb-4`}>
        <ButtonPrimary className={`w-full rounded-lg py-3 flex items-center justify-center font-heading`}>
            {isExpanded ? (
                <span className="font-heading font-semibold">Create New</span>
            ) : (
                <span className="font-heading text-xl -mt-1">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="inline-block align-middle" xmlns="http://www.w3.org/2000/svg">
                        <line x1="10" y1="4" x2="10" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="4" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                </span>
            )}
        </ButtonPrimary>
      </div>

      <div className="w-4/5 h-px bg-gray-200 my-2 mx-auto" />
      
      <nav className="flex-1 flex flex-col space-y-2 mt-4 px-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={isExpanded ? '' : label}
              className={`w-full flex items-center space-x-4 p-3 rounded-lg transition-colors ${
                isActive ? 'bg-[#F7D6D6] text-gray-800' : 'text-gray-600 hover:bg-[#fde3e3]'
              } ${!isExpanded ? 'justify-center' : ''}`}
            >
              <Icon />
              {isExpanded && <span className="font-body">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={`px-4 py-4 border-t border-gray-200`}>
         <button
           onClick={() => setIsExpanded(!isExpanded)}
           className={`w-full flex items-center space-x-4 p-3 rounded-lg text-gray-600 hover:bg-pink-50 ${!isExpanded ? 'justify-center' : ''}`}
         >
             {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
             {isExpanded && <span className="font-body">Collapse</span>}
         </button>
         <button
           onClick={() => signOut({ callbackUrl: '/' })}
           className={`w-full flex items-center space-x-4 p-3 rounded-lg text-gray-600 hover:bg-pink-50 ${!isExpanded ? 'justify-center' : ''}`}
         >
             <LogoutIcon />
             {isExpanded && <span className="font-body">Logout</span>}
         </button>
      </div>
    </aside>
  );
} 