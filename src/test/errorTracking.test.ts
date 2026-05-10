import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getStoredErrors } from '../utils/errorTracking'

describe('getStoredErrors', () => {
  beforeEach(() => localStorage.clear())

  it('returns empty array when no errors stored', () => {
    expect(getStoredErrors()).toEqual([])
  })
})
