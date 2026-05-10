import { describe, it, expect, beforeEach } from 'vitest'
import { STORAGE_KEYS, getStored, setStored, removeStored } from '../utils/storage'

describe('STORAGE_KEYS', () => {
  it('has all required keys', () => {
    expect(STORAGE_KEYS.WATER).toBe('hn_water')
    expect(STORAGE_KEYS.STREAK).toBe('hn_streak')
    expect(STORAGE_KEYS.EXPENSES).toBe('hn_expenses')
    expect(STORAGE_KEYS.NORA_MEMORY).toBe('hn_nora_memory_v2')
  })
})

describe('getStored / setStored', () => {
  beforeEach(() => localStorage.clear())

  it('returns fallback when key missing', () => {
    expect(getStored('missing_key', 42)).toBe(42)
  })

  it('stores and retrieves objects', () => {
    setStored('test_key', { name: 'Sarah', age: 32 })
    expect(getStored('test_key')).toEqual({ name: 'Sarah', age: 32 })
  })

  it('stores and retrieves arrays', () => {
    setStored('test_arr', [1, 2, 3])
    expect(getStored('test_arr')).toEqual([1, 2, 3])
  })

  it('removeStored clears the key', () => {
    setStored('to_remove', 'hello')
    removeStored('to_remove')
    expect(getStored('to_remove')).toBeNull()
  })
})
