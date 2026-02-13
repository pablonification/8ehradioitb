'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

type PaginationProps = {
  totalPages: number
  basePath: string
}

function PaginationContent({ totalPages, basePath }: PaginationProps) {
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get('page') ?? '1') || 1

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', pageNumber.toString())
    return `${basePath}?${params.toString()}`
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <nav className="mt-12 flex items-center justify-center space-x-2">
      {/* Previous Button */}
      {currentPage === 1 ? (
        <span className="font-body cursor-not-allowed rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400">
          Previous
        </span>
      ) : (
        <Link
          href={createPageURL(currentPage - 1)}
          className="font-body rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Previous
        </Link>
      )}

      {/* Page Numbers */}
      {pages.map((page) => (
        <Link
          key={page}
          href={createPageURL(page)}
          className={`font-body rounded-md px-4 py-2 text-sm font-medium ${
            currentPage === page
              ? 'border-red-600 bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {page}
        </Link>
      ))}

      {/* Next Button */}
      {currentPage === totalPages ? (
        <span className="font-body cursor-not-allowed rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400">
          Next
        </span>
      ) : (
        <Link
          href={createPageURL(currentPage + 1)}
          className="font-body rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Next
        </Link>
      )}
    </nav>
  )
}

function PaginationFallback() {
  return (
    <nav className="mt-12 flex items-center justify-center space-x-2">
      <div className="font-body rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400">
        Loading...
      </div>
    </nav>
  )
}

export default function Pagination({ totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null // No need to render pagination

  return (
    <Suspense fallback={<PaginationFallback />}>
      <PaginationContent totalPages={totalPages} basePath={basePath} />
    </Suspense>
  )
}
