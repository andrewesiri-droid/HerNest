import { describe, it, expect, vi } from 'vitest'
import { DEFAULT_CATS, CAT_META } from '../features/budget/useBudget'

describe('DEFAULT_CATS', () => {
  it('has 6 categories', () => {
    expect(DEFAULT_CATS).toHaveLength(6)
  })

  it('all categories have required fields', () => {
    DEFAULT_CATS.forEach(cat => {
      expect(cat).toHaveProperty('lb')
      expect(cat).toHaveProperty('spent')
      expect(cat).toHaveProperty('budget')
      expect(cat.spent).toBe(0)
      expect(cat.budget).toBeGreaterThan(0)
    })
  })
})

describe('CAT_META', () => {
  it('has Groceries with correct budget', () => {
    expect(CAT_META.Groceries.budget).toBe(700)
  })

  it('all meta entries have budget and color', () => {
    Object.entries(CAT_META).forEach(([name, meta]) => {
      expect(meta.budget).toBeGreaterThan(0)
      expect(meta.c).toBeTruthy()
    })
  })
})
