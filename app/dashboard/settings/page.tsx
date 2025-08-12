'use client'

import React, { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { User, Save, Trash2, Eye, EyeOff, Shield, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showApiKeys, setShowApiKeys] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  
  // Profile settings
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  
  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordChangeError, setPasswordChangeError] = useState('')
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false)
  
  // API Keys
  const [openaiKey, setOpenaiKey] = useState('')
  const [anthropicKey, setAnthropicKey] = useState('')
  
  // Preferences
  const [defaultModel, setDefaultModel] = useState('gpt-4o')
  const [autoSave, setAutoSave] = useState(true)
  
  const supabase = createSupabaseClient()

  const models = [
    // Top OpenAI Models (2025)
    { value: 'gpt-5', label: 'GPT-5 (OpenAI) - Latest' },
    { value: 'gpt-4.1', label: 'GPT-4.1 (OpenAI) - Enhanced' },
    { value: 'gpt-4.5', label: 'GPT-4.5 (OpenAI) - Most Powerful' },
    { value: 'gpt-4o', label: 'GPT-4o (OpenAI) - Fast & Efficient' },
    { value: 'o1', label: 'o1 (OpenAI) - Reasoning Model' },
    { value: 'gpt-4', label: 'GPT-4 (OpenAI) - Classic' },
    
    // Top Anthropic Models (2025)
    { value: 'claude-sonnet-4', label: 'Claude Sonnet 4 (Anthropic) - Latest 2025' },
    { value: 'claude-3.7-sonnet', label: 'Claude 3.7 Sonnet (Anthropic) - Hybrid Reasoning' },
    { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (Anthropic) - Balanced' },
    { value: 'claude-opus-4', label: 'Claude Opus 4 (Anthropic) - Most Capable' },
    { value: 'claude-3.5-haiku', label: 'Claude 3.5 Haiku (Anthropic) - Fast' },
  ]

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser(user)
          setDisplayName(user.user_metadata?.display_name || '')
          setBio(user.user_metadata?.bio || '')
          
          // Load user settings from database
          await loadUserSettings()
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [supabase])

  const loadUserSettings = async () => {
    try {
      const response = await fetch('/api/user-settings')
      if (response.ok) {
        const settings = await response.json()
        setDefaultModel(settings.default_model || 'gpt-4o')
        setAutoSave(settings.auto_save !== false)
        setOpenaiKey(settings.openai_api_key || '')
        setAnthropicKey(settings.anthropic_api_key || '')
        // Theme is handled by ThemeContext
      } else {
        console.log('No settings found, using defaults')
      }
    } catch (error) {
      console.error('Error loading user settings:', error)
      // Fallback to localStorage for backwards compatibility
      const savedPrefs = localStorage.getItem('promptcraft_settings')
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs)
        setDefaultModel(prefs.defaultModel || 'gpt-4o')
        setAutoSave(prefs.autoSave !== false)
        setOpenaiKey(prefs.openaiKey || '')
        setAnthropicKey(prefs.anthropicKey || '')
      }
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: displayName,
          bio: bio
        }
      })

      if (error) throw error
      
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordChangeError('')
    setPasswordChangeSuccess(false)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordChangeError('Please fill in all password fields')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordChangeError('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setPasswordChangeError('Password must be at least 6 characters long')
      return
    }

    if (currentPassword === newPassword) {
      setPasswordChangeError('New password must be different from current password')
      return
    }

    setChangingPassword(true)
    try {
      // First verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })

      if (signInError) {
        setPasswordChangeError('Current password is incorrect')
        setChangingPassword(false)
        return
      }

      // If current password is correct, update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setPasswordChangeSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setPasswordChangeSuccess(false)
      }, 5000)
    } catch (error) {
      console.error('Error changing password:', error)
      setPasswordChangeError('Failed to change password. Please try again.')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleSavePreferences = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/user-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          default_model: defaultModel,
          auto_save: autoSave,
          openai_api_key: openaiKey,
          anthropic_api_key: anthropicKey
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      const result = await response.json()
      alert('Settings saved successfully!')
      
      // Update localStorage as fallback
      const preferences = {
        defaultModel,
        autoSave,
        openaiKey,
        anthropicKey
      }
      localStorage.setItem('promptcraft_settings', JSON.stringify(preferences))
      
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('Failed to save preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    
    try {
      // In a real app, you'd want to implement proper account deletion
      // This might involve calling a server endpoint that handles cleanup
      alert('Account deletion would be implemented here. This is a demo.')
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account. Please contact support.')
    }
  }

  const resetPasswordChangeState = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setPasswordChangeError('')
    setPasswordChangeSuccess(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Enhanced Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account, preferences, and security settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        {/* Enhanced Tabs List */}
        <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-gray-100 to-indigo-100 border-2 border-gray-200 rounded-lg p-1 shadow-lg">
          <TabsTrigger 
            value="profile" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 hover:bg-white/50"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger 
            value="api"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 hover:bg-white/50"
          >
            API Keys
          </TabsTrigger>
          <TabsTrigger 
            value="preferences"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 hover:bg-white/50"
          >
            Preferences
          </TabsTrigger>
          <TabsTrigger 
            value="security"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 hover:bg-white/50"
          >
            Security
          </TabsTrigger>
        </TabsList>

        {/* Enhanced Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300 group">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-900 group-hover:text-blue-950 transition-colors duration-300">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                  <User className="h-5 w-5 text-white" />
                </div>
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription className="text-blue-700 group-hover:text-blue-800 transition-colors duration-300">
                Update your profile information and how others see you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200"
                />
                <p className="text-sm text-blue-600">Email cannot be changed</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-gray-700 font-medium">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  className="border-2 border-gray-200 focus:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-gray-700 font-medium">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="border-2 border-gray-200 focus:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md"
                />
              </div>
              
              <Button 
                onClick={handleSaveProfile} 
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 border border-blue-500 hover:border-blue-400 hover:scale-105"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced API Keys Tab */}
        <TabsContent value="api" className="space-y-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-green-300 group">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-green-900 group-hover:text-green-950 transition-colors duration-300">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <span>API Configuration</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKeys(!showApiKeys)}
                  className="border-2 border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105"
                >
                  {showApiKeys ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide Keys
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show Keys
                    </>
                  )}
                </Button>
              </CardTitle>
              <CardDescription className="text-green-700 group-hover:text-green-800 transition-colors duration-300">
                Configure your AI service API keys for enhanced functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-start space-x-3">
                  <div className="p-1 bg-gradient-to-br from-green-500 to-emerald-600 rounded">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-green-800 font-medium">🔒 Secure Storage</p>
                    <div className="text-sm text-green-700 mt-2 space-y-1">
                      <p><strong>✅ Encrypted:</strong> API keys are encrypted before storage</p>
                      <p><strong>✅ Persistent:</strong> Available across all your devices</p>
                      <p><strong>✅ Secure:</strong> Only you can access your keys</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openaiKey" className="text-gray-700 font-medium">OpenAI API Key</Label>
                <Input
                  id="openaiKey"
                  type={showApiKeys ? "text" : "password"}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="border-2 border-gray-200 focus:border-green-400 transition-all duration-300 shadow-sm hover:shadow-md"
                />
                <p className="text-sm text-green-600">Required for GPT-4, GPT-4o, GPT-4.1, GPT-4.5, GPT-5, and other OpenAI models</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="anthropicKey" className="text-gray-700 font-medium">Anthropic API Key</Label>
                <Input
                  id="anthropicKey"
                  type={showApiKeys ? "text" : "password"}
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="border-2 border-gray-200 focus:border-green-400 transition-all duration-300 shadow-sm hover:shadow-md"
                />
                <p className="text-sm text-green-600">Required for Claude 3 and Claude 3.5 models</p>
              </div>

              <Button 
                onClick={handleSavePreferences} 
                disabled={saving}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-300 border border-green-500 hover:border-green-400 hover:scale-105"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save API Keys
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-purple-300 group">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-purple-900 group-hover:text-purple-950 transition-colors duration-300">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                  <User className="h-5 w-5 text-white" />
                </div>
                <span>Application Preferences</span>
              </CardTitle>
              <CardDescription className="text-purple-700 group-hover:text-purple-800 transition-colors duration-300">
                Customize your PromptCraft Studio experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultModel" className="text-gray-700 font-medium">Default AI Model</Label>
                <Select value={defaultModel} onValueChange={setDefaultModel}>
                  <SelectTrigger className="border-2 border-gray-200 hover:border-purple-300 focus:border-purple-400 transition-all duration-300 shadow-sm hover:shadow-md">
                    <SelectValue placeholder="Select default model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                <input
                  type="checkbox"
                  id="autoSave"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-white border-2 border-purple-300 rounded focus:ring-purple-500 focus:ring-2"
                />
                <Label htmlFor="autoSave" className="text-gray-700 font-medium cursor-pointer">Auto-save prompts while editing</Label>
              </div>
              
              <Button 
                onClick={handleSavePreferences} 
                disabled={saving}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all duration-300 border border-purple-500 hover:border-purple-400 hover:scale-105"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-gradient-to-br from-red-50 to-orange-100 border-2 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-red-300 group">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-900 group-hover:text-red-950 transition-colors duration-300">
                <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span>Change Password</span>
              </CardTitle>
              <CardDescription className="text-red-700 group-hover:text-red-800 transition-colors duration-300">
                Change your password to keep your account secure. You'll need to verify your current password first.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {passwordChangeSuccess && (
                <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg shadow-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-green-800 font-medium">Password changed successfully!</p>
                  </div>
                  <p className="text-sm text-green-700 mt-1">Your password has been updated. You can now use your new password to sign in.</p>
                </div>
              )}

              <div className="space-y-6">
                {/* Enhanced Security Notice */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-sm text-blue-800 font-medium">Security Verification Required</p>
                  </div>
                  <p className="text-sm text-blue-700 mt-2">
                    Enter your current password to verify your identity before changing to a new password.
                  </p>
                </div>

                {/* Enhanced Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-gray-700 font-medium">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value)
                        setPasswordChangeError('')
                      }}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                      className="border-2 border-gray-200 focus:border-red-400 pr-10 transition-all duration-300 shadow-sm hover:shadow-md"
                      disabled={changingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-600 hover:text-red-800 transition-colors duration-300"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Enhanced New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-gray-700 font-medium">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value)
                        setPasswordChangeError('')
                      }}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      className="border-2 border-gray-200 focus:border-red-400 pr-10 transition-all duration-300 shadow-sm hover:shadow-md"
                      disabled={changingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-600 hover:text-red-800 transition-colors duration-300"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Enhanced Confirm New Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword" className="text-gray-700 font-medium">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmNewPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        setPasswordChangeError('')
                      }}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      className="border-2 border-gray-200 focus:border-red-400 pr-10 transition-all duration-300 shadow-sm hover:shadow-md"
                      disabled={changingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-600 hover:text-red-800 transition-colors duration-300"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 p-4 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-2">Password Requirements:</p>
                  <ul className="text-xs space-y-1">
                    <li className={`flex items-center space-x-2 ${newPassword.length >= 6 ? 'text-green-700' : 'text-gray-500'}`}>
                      <CheckCircle className={`h-3 w-3 ${newPassword.length >= 6 ? 'text-green-600' : 'text-gray-400'}`} />
                      <span>At least 6 characters long</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${newPassword === confirmPassword && newPassword.length > 0 ? 'text-green-700' : 'text-gray-500'}`}>
                      <CheckCircle className={`h-3 w-3 ${newPassword === confirmPassword && newPassword.length > 0 ? 'text-green-600' : 'text-gray-400'}`} />
                      <span>Passwords match</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${currentPassword !== newPassword && newPassword.length > 0 ? 'text-green-700' : 'text-gray-500'}`}>
                      <CheckCircle className={`h-3 w-3 ${currentPassword !== newPassword && newPassword.length > 0 ? 'text-green-600' : 'text-gray-400'}`} />
                      <span>Different from current password</span>
                    </li>
                  </ul>
                </div>

                {/* Error Message */}
                {passwordChangeError && (
                  <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <p className="text-red-800 font-medium">Error</p>
                    </div>
                    <p className="text-sm text-red-700 mt-1">{passwordChangeError}</p>
                  </div>
                )}

                {/* Change Password Button */}
                <div className="flex gap-3">
                  <Button 
                    onClick={handleChangePassword}
                    disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 6}
                    className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Changing Password...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={resetPasswordChangeState}
                    disabled={changingPassword}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    Clear Form
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-400">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 