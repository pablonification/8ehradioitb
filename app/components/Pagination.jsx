"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function PaginationContent({ totalPages, basePath }) {
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const createPageURL = (pageNumber) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${basePath}?${params.toString()}`;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="flex justify-center items-center space-x-2 mt-12">
      {/* Previous Button */}
      <Link
        href={createPageURL(currentPage - 1)}
        className={`px-4 py-2 rounded-md text-sm font-body font-medium ${
          currentPage === 1
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gray-100 text-gray-700 hover:bg-gray-50"
        }`}
        aria-disabled={currentPage === 1}
        tabIndex={currentPage === 1 ? -1 : undefined}
      >
        Previous
      </Link>

      {/* Page Numbers */}
      {pages.map((page) => (
        <Link
          key={page}
          href={createPageURL(page)}
          className={`px-4 py-2 rounded-md text-sm font-body font-medium ${
            currentPage === page
              ? "bg-red-600 text-white border-red-600"
              : "bg-gray-100 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {page}
        </Link>
      ))}

      {/* Next Button */}
      <Link
        href={createPageURL(currentPage + 1)}
        className={`px-4 py-2 rounded-md text-sm font-body font-medium ${
          currentPage === totalPages
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gray-100 text-gray-700 hover:bg-gray-50"
        }`}
        aria-disabled={currentPage === totalPages}
        tabIndex={currentPage === totalPages ? -1 : undefined}
      >
        Next
      </Link>
    </nav>
  );
}

function PaginationFallback() {
  return (
    <nav className="flex justify-center items-center space-x-2 mt-12">
      <div className="px-4 py-2 rounded-md text-sm font-body font-medium bg-gray-100 text-gray-400">
        Loading...
      </div>
    </nav>
  );
}

export default function Pagination({ totalPages, basePath }) {
  return (
    <Suspense fallback={<PaginationFallback />}>
      <PaginationContent totalPages={totalPages} basePath={basePath} />
    </Suspense>
  );
}
