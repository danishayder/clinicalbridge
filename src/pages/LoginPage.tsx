import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { HeartPulse, Eye, EyeOff, Building2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [errorMsg, setErrorMsg] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [role, setRole] = useState('program_admin')

  const navigate = useNavigate()
  const { toast } = useToast()
  const { setUser, setSession } = useAuthStore()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMsg(error.message)
        throw error
      }

      setSession(data.session)

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single()

      if (profileError) {
        setErrorMsg('Profile not found. Please contact admin.')
        throw profileError
      }

      if (profile) {
        setUser(profile)
        toast(`Welcome back, ${profile.first_name}!`, 'success')
        navigate('/')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      if (!errorMsg) setErrorMsg(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')

    try {
      // Step 1: Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        setErrorMsg('Auth signup failed: ' + authError.message)
        throw authError
      }

      if (!authData.user) {
        throw new Error('User creation failed')
      }

      console.log('Auth user created:', authData.user.id)

      // Step 2: IMMEDIATELY sign in to establish session (critical fix!)
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) {
        setErrorMsg('Auto-login failed: ' + loginError.message)
        throw loginError
      }

      setSession(loginData.session)
      console.log('Session established')

      // Step 3: Create organization (now authenticated with valid session)
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          slug: orgSlug,
          plan: 'basic',
        })
        .select()
        .single()

      if (orgError) {
        setErrorMsg('Failed to create organization: ' + orgError.message)
        throw orgError
      }

      console.log('Organization created:', org)

      // Step 4: Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          role: role,
          org_id: org.id,
        })

      if (profileError) {
        console.error('Profile insert error:', profileError)
        setErrorMsg('Profile creation failed: ' + profileError.message)
        throw profileError
      }

      console.log('Profile created successfully')

      // Step 5: Fetch profile and redirect to dashboard
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single()

      if (profile) {
        setUser(profile)
        toast(`Welcome, ${profile.first_name}!`, 'success')
        navigate('/')
      }
    } catch (err: any) {
      console.error('Registration error:', err)
      if (!errorMsg) setErrorMsg(err.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-bridge">
            <HeartPulse className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-surface-900">Clinical Bridge</h1>
            <p className="text-sm text-surface-500">Clinical Education Management</p>
          </div>
        </div>

        <Card className="p-6">
          {/* Error display */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-danger-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-danger-700">{errorMsg}</span>
            </div>
          )}

          <div className="flex gap-1 mb-6 bg-surface-100 rounded-lg p-1">
            <button
              onClick={() => { setMode('login'); setErrorMsg('') }}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-md transition-all',
                mode === 'login' ? 'bg-surface-0 text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
              )}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setErrorMsg('') }}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-md transition-all',
                mode === 'register' ? 'bg-surface-0 text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
              )}
            >
              New Organization
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="cb-input"
                  placeholder="you@organization.edu"
                  required
                />
              </div>
              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="cb-input pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
              >
                Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="cb-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="cb-input"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="form-label">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Organization Name
                  </span>
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value)
                    setOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
                  }}
                  className="cb-input"
                  placeholder="University Health Sciences"
                  required
                />
              </div>
              <div>
                <label className="form-label">Organization Slug</label>
                <input
                  type="text"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  className="cb-input"
                  placeholder="university-health-sciences"
                  required
                />
                <p className="text-2xs text-surface-500 mt-1">Used for your custom URL</p>
              </div>
              <div>
                <label className="form-label">Your Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="cb-select"
                >
                  <option value="program_admin">Program Administrator</option>
                  <option value="faculty">Faculty</option>
                  <option value="accreditation_lead">Accreditation Lead</option>
                </select>
              </div>
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="cb-input"
                  placeholder="you@organization.edu"
                  required
                />
              </div>
              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="cb-input pr-10"
                    placeholder="Min 8 characters"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
              >
                Create Organization
              </Button>
            </form>
          )}
        </Card>

        <p className="text-center text-xs text-surface-500 mt-6">
          By using Clinical Bridge, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}