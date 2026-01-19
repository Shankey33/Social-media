'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './auth-context'
import { env } from './env.js'

const SocketContext = createContext<Socket | null>(null)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token')
      const wsUrl = env.WS_URL
      
      const newSocket = io(wsUrl, {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    } else {
      setSocket((prevSocket) => {
        if (prevSocket) {
          prevSocket.close()
        }
        return null
      })
    }
  }, [user])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
