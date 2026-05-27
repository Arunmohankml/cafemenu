'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { auth, googleProvider, signInWithEmailAndPassword, signInWithPopup, signOut } from '@/lib/firebase'
import { User } from 'firebase/auth'

type Profile = {
  id: string
  email: string
  full_name: string | null
  role: 'customer' | 'staff' | 'admin'
  avatar_url: string | null
}

type AuthContextType = {
  user: User | null
  profile: Profile | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        try {
          // 1. Establish backend HttpOnly session cookie
          const idToken = await firebaseUser.getIdToken()
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          })

          // 2. Fetch or create user profile in Supabase
          await fetchProfile(firebaseUser)
        } catch (error) {
          console.error('Error synchronizing auth session:', error)
          setLoading(false)
        }
      } else {
        // Clear backend session cookie
        await fetch('/api/auth/logout', { method: 'POST' })
        setProfile(null)
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const fetchProfile = async (firebaseUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', firebaseUser.uid)
        .single()

      if (error || !data) {
        // Create a new staff profile in Supabase on first signup
        const newProfile = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          full_name: firebaseUser.displayName || 'Staff Member',
          role: 'staff' as const,
          avatar_url: firebaseUser.photoURL || null,
        }

        const { error: insertError } = await supabase
          .from('profiles')
          .insert(newProfile)

        if (insertError) {
          console.error('Error inserting new profile:', insertError)
        }
        setProfile(newProfile)
      } else {
        setProfile(data)
      }
    } catch (e) {
      console.error('Error fetching/creating profile:', e)
    } finally {
      setLoading(false)
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return { error: null }
    } catch (error: any) {
      return { error }
    }
  }

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
      return { error: null }
    } catch (error: any) {
      return { error }
    }
  }

  const handleSignOut = async () => {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      signInWithEmail, signInWithGoogle, signOut: handleSignOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
