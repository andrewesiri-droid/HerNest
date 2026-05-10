import { describe, it, expect } from 'vitest'
import { EMAILS, APP } from '../config/constants'

describe('EMAILS', () => {
  it('has valid email format', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    expect(EMAILS.PRIVACY).toMatch(emailRegex)
    expect(EMAILS.HELLO).toMatch(emailRegex)
  })
})

describe('APP', () => {
  it('has required fields', () => {
    expect(APP.NAME).toBe('HerNest')
    expect(APP.URL).toContain('https://')
    expect(APP.VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
