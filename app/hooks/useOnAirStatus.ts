import { useState, useEffect } from 'react'

interface StreamConfigResponse {
  onAir?: boolean
}

interface UseOnAirStatusResult {
  isOnAir: boolean
  loading: boolean
  error: string | null
}

export function useOnAirStatus(): UseOnAirStatusResult {
  const [isOnAir, setIsOnAir] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOnAirStatus = async () => {
      try {
        const response = await fetch('/api/stream-config')
        if (!response.ok) {
          throw new Error('Failed to fetch stream config')
        }
        const data = (await response.json()) as StreamConfigResponse
        setIsOnAir(data?.onAir || false)
      } catch (err: unknown) {
        console.error('Error fetching on-air status:', err)
        setError(err instanceof Error ? err.message : String(err))
        // Default to false if there's an error
        setIsOnAir(false)
      } finally {
        setLoading(false)
      }
    }

    fetchOnAirStatus()
  }, [])

  return { isOnAir, loading, error }
}
