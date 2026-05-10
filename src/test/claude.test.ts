import { describe, it, expect } from 'vitest'

describe('claude API wrapper', () => {
  it('claude mock exists and is a function', async () => {
    const mod = await import('../utils/claude')
    expect(typeof mod.claude).toBe('function')
  })

  it('claude mock returns expected string', async () => {
    const { claude } = await import('../utils/claude')
    const result = await claude('system', 'user')
    expect(typeof result).toBe('string')
  })
})
