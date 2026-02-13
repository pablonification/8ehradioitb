declare module 'icy' {
  import type { IncomingMessage } from 'http'

  type IcyRequest = {
    on: (event: 'error', callback: (error: Error) => void) => void
  }

  const icy: {
    get: (url: string, callback: (response: IncomingMessage) => void) => IcyRequest
  }

  export default icy
}
