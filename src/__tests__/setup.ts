import "@testing-library/jest-dom/vitest"

// Mock chrome APIs
const storageMock: Record<string, unknown> = {}

globalThis.chrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    },
    getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`)
  },
  storage: {
    local: {
      get: vi.fn((keys: string | string[]) => {
        if (typeof keys === "string") {
          return Promise.resolve({ [keys]: storageMock[keys] })
        }
        const result: Record<string, unknown> = {}
        for (const key of keys) {
          result[key] = storageMock[key]
        }
        return Promise.resolve(result)
      }),
      set: vi.fn((items: Record<string, unknown>) => {
        Object.assign(storageMock, items)
        return Promise.resolve()
      }),
      remove: vi.fn((keys: string | string[]) => {
        const keyArr = typeof keys === "string" ? [keys] : keys
        for (const key of keyArr) {
          delete storageMock[key]
        }
        return Promise.resolve()
      })
    }
  },
  tabs: {
    captureVisibleTab: vi.fn(),
    query: vi.fn(),
    onActivated: { addListener: vi.fn() }
  },
  sidePanel: {
    open: vi.fn()
  },
  alarms: {
    create: vi.fn(),
    onAlarm: { addListener: vi.fn() }
  },
  scripting: {
    executeScript: vi.fn()
  },
  webNavigation: {
    onCompleted: { addListener: vi.fn() }
  },
  offscreen: {
    createDocument: vi.fn(),
    closeDocument: vi.fn(),
    Reason: { AUDIO_PLAYBACK: "AUDIO_PLAYBACK" }
  },
  tabCapture: {
    getMediaStreamId: vi.fn()
  },
  downloads: {
    download: vi.fn()
  },
  commands: {
    onCommand: { addListener: vi.fn() }
  }
} as unknown as typeof chrome
