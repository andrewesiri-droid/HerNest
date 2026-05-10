import { vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock Firebase
vi.mock('../utils/firebase', () => ({
  saveData: vi.fn().mockResolvedValue(undefined),
  loadData: vi.fn().mockResolvedValue(null),
  auth: {},
}))

// Mock claude
vi.mock('../utils/claude', () => ({
  claude: vi.fn().mockResolvedValue('{"greeting":"Good morning"}'),
}))
