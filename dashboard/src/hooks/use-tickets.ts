'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Ticket, TicketFilters } from '@/lib/types'

function buildQueryString(filters: TicketFilters): string {
  const params = new URLSearchParams()
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  if (filters.status) params.set('status', filters.status)
  if (filters.priority) params.set('priority', filters.priority)
  if (filters.requester) params.set('requester', filters.requester)
  if (filters.category) params.set('category', filters.category)
  if (filters.resolvedBy) params.set('resolvedBy', filters.resolvedBy)
  return params.toString()
}

export function useTickets(filters: TicketFilters) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const filtersKey = JSON.stringify(filters)

  const fetchTickets = useCallback(async () => {
    if (hasFetched.current) {
      setRefreshing(true)
    }
    setError(null)
    try {
      const qs = buildQueryString(filters)
      const res = await fetch(`/api/tickets?${qs}`)
      if (!res.ok) throw new Error('Error fetching tickets')
      const data = await res.json()
      setTickets(data)
    } catch (err) {
      setError(String(err))
    } finally {
      setInitialLoading(false)
      setRefreshing(false)
      hasFetched.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  return { tickets, loading: initialLoading, refreshing, error, refetch: fetchTickets }
}
