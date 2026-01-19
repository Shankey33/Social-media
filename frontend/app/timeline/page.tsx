'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { useSocket } from '@/lib/socket-context'

interface Post {
  _id: string
  title: string
  description: string
  author: {
    _id: string
    username: string
    email: string
  }
  createdAt: string
}

interface User {
  _id: string
  username: string
  email: string
}

interface CurrentUser {
  id: string
  email: string
  username: string
  following: string[]
  followers: string[]
  friends: string[]
  sentFriendRequests: string[]
  receivedFriendRequests: string[]
}

export default function TimelinePage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const socket = useSocket()
  const [posts, setPosts] = useState<Post[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const loadCountRef = useRef(0)

  const fetchCurrentUser = useCallback(async () => {
    try {
      console.log('Fetching/refreshing current user data...');
      const response = await api.get('/users/me')
      console.log('✅ Current user data received:', response.data)
      setCurrentUser(response.data)
      return response.data
    } catch (error) {
      console.error('❌ Failed to fetch current user:', error)
      return null
    }
  }, [])

  const fetchTimeline = useCallback(async () => {
    try {
      console.log('Fetching timeline posts...');
      const response = await api.get('/posts/timeline')
      console.log(`✅ Received ${response.data.length} posts for timeline`)
      setPosts(response.data)
    } catch (error) {
      console.error('❌ Failed to fetch timeline:', error)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      console.log('Fetching all users...');
      const response = await api.get('/users')
      console.log(`📊 Received ${response.data.length} total users from API`)

      const currentUserId = user?.id
      console.log('Filtering out current user:', currentUserId)

      const filtered = response.data.filter((u: any) => {
        const uId = u._id || u.id
        return uId !== currentUserId
      })

      console.log(`📊 After filtering current user: ${filtered.length} users`)
      setUsers(filtered)
    } catch (error) {
      console.error('❌ Failed to fetch users:', error)
    }
  }, [user?.id])

  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.trim().length === 0) {
      setSearchResults([])
      return
    }
    try {
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`)
      setSearchResults(response.data)
    } catch (error) {
      console.error('Failed to search users:', error)
      setSearchResults([])
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchUsers])

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    // Prevent double-firing in Strict Mode and redundant re-loads
    if (loadCountRef.current > 0) {
      console.log('⏳ Data already loading or loaded for this session');
      return;
    }

    const loadData = async () => {
      loadCountRef.current += 1;
      console.log('🔄 Initializing timeline data for user:', user.username)
      setLoading(true)

      // Reset state
      setPosts([])
      setUsers([])
      setSearchResults([])
      setCurrentUser(null)

      try {
        // Fetch everything in parallel
        await Promise.all([
          fetchCurrentUser(),
          fetchTimeline(),
          fetchUsers()
        ])
      } catch (error) {
        console.error('❌ Error during initial data load:', error)
        loadCountRef.current = 0; // Allow retry on failure
      } finally {
        setLoading(false)
        console.log('🏁 Data loading complete')
      }
    }

    loadData()
  }, [user?.id, router, fetchCurrentUser, fetchTimeline, fetchUsers])

  // Refresh timeline when page becomes visible (e.g., when navigating back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        fetchTimeline()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, fetchTimeline])

  useEffect(() => {
    if (!socket) return

    const handleNotification = (data: { type: string; message: string }) => {
      toast({
        title: 'Notification',
        description: data.message,
      })
    }

    socket.on('notification', handleNotification)

    return () => {
      socket.off('notification', handleNotification)
    }
  }, [socket, toast])

  const handleSendFriendRequest = async (userId: string) => {
    try {
      await api.post(`/users/friend-request/${userId}`)
      toast({
        title: 'Success',
        description: 'Friend request sent successfully',
      })
      fetchCurrentUser()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send friend request',
        variant: 'destructive',
      })
    }
  }

  const handleAcceptFriendRequest = async (userId: string) => {
    try {
      await api.post(`/users/friend-request/${userId}/accept`)
      toast({
        title: 'Success',
        description: 'Friend request accepted',
      })
      fetchCurrentUser()
      fetchTimeline()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to accept friend request',
        variant: 'destructive',
      })
    }
  }

  const handleRejectFriendRequest = async (userId: string) => {
    try {
      await api.post(`/users/friend-request/${userId}/reject`)
      toast({
        title: 'Success',
        description: 'Friend request rejected',
      })
      fetchCurrentUser()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reject friend request',
        variant: 'destructive',
      })
    }
  }

  const handleCancelFriendRequest = async (userId: string) => {
    try {
      await api.delete(`/users/friend-request/${userId}`)
      toast({
        title: 'Success',
        description: 'Friend request cancelled',
      })
      fetchCurrentUser()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cancel friend request',
        variant: 'destructive',
      })
    }
  }

  const handleRemoveFriend = async (userId: string) => {
    try {
      await api.delete(`/users/friends/${userId}`)
      toast({
        title: 'Success',
        description: 'Friend removed',
      })
      fetchCurrentUser()
      fetchTimeline()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to remove friend',
        variant: 'destructive',
      })
    }
  }

  const getFriendStatus = (userId: string) => {
    if (!currentUser) return 'none'
    const userIdStr = userId.toString()

    if (currentUser.friends?.some((id: any) => id.toString() === userIdStr)) {
      return 'friend'
    }
    if (currentUser.sentFriendRequests?.some((id: any) => id.toString() === userIdStr)) {
      return 'sent'
    }
    if (currentUser.receivedFriendRequests?.some((id: any) => id.toString() === userIdStr)) {
      return 'received'
    }
    return 'none'
  }

  const renderFriendButton = (u: User) => {
    const status = getFriendStatus(u._id)

    switch (status) {
      case 'friend':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleRemoveFriend(u._id)}
          >
            Remove Friend
          </Button>
        )
      case 'sent':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCancelFriendRequest(u._id)}
          >
            Cancel Request
          </Button>
        )
      case 'received':
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => handleAcceptFriendRequest(u._id)}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRejectFriendRequest(u._id)}
            >
              Reject
            </Button>
          </div>
        )
      default:
        return (
          <Button
            size="sm"
            variant="default"
            onClick={() => handleSendFriendRequest(u._id)}
          >
            Add Friend
          </Button>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold">Social Media App</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
              <Button variant="outline" onClick={() => router.push('/create-post')}>
                Create Post
              </Button>
              <Button variant="ghost" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">Timeline</h2>
            {posts.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                <p>No posts yet. Add some friends to see their posts!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post._id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{post.title}</h3>
                        <p className="text-sm text-gray-500">by {post.author?.username || 'Unknown'}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{post.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Search People</h2>
              <div className="bg-white rounded-lg shadow p-4">
                <Input
                  type="text"
                  placeholder="Search by username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-4"
                />
                {searchResults.length > 0 && (
                  <div className="space-y-3">
                    {searchResults.map((u) => (
                      <div key={u._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">{u.username}</p>
                        </div>
                        {renderFriendButton(u)}
                      </div>
                    ))}
                  </div>
                )}
                {searchQuery && searchResults.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No users found</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">All Users</h2>
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 space-y-3">
                  {users.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No other users</p>
                  ) : (
                    users.map((u) => (
                      <div key={u._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">{u.username}</p>
                        </div>
                        {renderFriendButton(u)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {currentUser?.receivedFriendRequests && currentUser.receivedFriendRequests.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Friend Requests</h2>
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 space-y-3">
                    {users
                      .filter((u) => currentUser.receivedFriendRequests?.some((id: any) => id.toString() === u._id))
                      .map((u) => (
                        <div key={u._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                          <div>
                            <p className="font-medium">{u.username}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAcceptFriendRequest(u._id)}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectFriendRequest(u._id)}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
