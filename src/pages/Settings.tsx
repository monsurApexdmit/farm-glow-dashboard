import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Bell, Shield, Palette, Save, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema } from "@/utils/validation";
import { authService } from "@/services/auth.service";
import { apiClient } from "@/services/api";
import { API_ENDPOINTS } from "@/utils/constants";

interface PasswordFormData {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Profile state
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    language: "en",
    timezone: "UTC",
    theme: "light" as const,
    notifications_enabled: true,
  });

  // Password form
  const form = useForm<PasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      new_password_confirmation: "",
    },
  });

  // Load user profile on mount
  useEffect(() => {
    if (user) {
      setProfile({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const prefs = await apiClient.get<any>(API_ENDPOINTS.USERS_PREFERENCES);
      if (prefs) {
        setPreferences({
          language: prefs.language || "en",
          timezone: prefs.timezone || "UTC",
          theme: prefs.theme || "light",
          notifications_enabled: prefs.notifications_enabled !== false,
        });
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
    }
  };

  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      await apiClient.put(`${API_ENDPOINTS.USERS_ME}`, {
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
      });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePreferencesSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.put(`${API_ENDPOINTS.USERS_PREFERENCES}`, preferences);
      toast({
        title: "Success",
        description: "Preferences updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update preferences",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setPasswordError("");
    setPasswordSuccess("");
    try {
      await authService.changePassword(data);
      setPasswordSuccess("Password changed successfully");
      form.reset();
      setTimeout(() => setPasswordSuccess(""), 3000);
    } catch (error: any) {
      setPasswordError(error.message || "Failed to change password");
    }
  };

  const getInitials = () => {
    return `${profile.first_name[0] || ""}${profile.last_name[0] || ""}`.toUpperCase() || "U";
  };

  return (
    <PageShell>
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="text-gray-600 mt-1">Manage your account and preferences</p>

      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-green-600" />
            <div>
              <CardTitle className="text-lg">Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-16 h-16 bg-green-600 text-white">
              <AvatarFallback className="bg-green-600 text-white text-lg font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm text-gray-500">Avatar</p>
              <Button variant="outline" size="sm" className="mt-1">
                Change Photo
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={profile.first_name}
                onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={profile.last_name}
                onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
          </div>

          <Button onClick={handleProfileSave} disabled={profileLoading} className="gap-2">
            {profileLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Profile
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">Preferences</CardTitle>
              <CardDescription>Customize your experience</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={preferences.language} onValueChange={(v) => setPreferences({ ...preferences, language: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={preferences.timezone} onValueChange={(v) => setPreferences({ ...preferences, timezone: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="EST">EST (UTC-5)</SelectItem>
                  <SelectItem value="CST">CST (UTC-6)</SelectItem>
                  <SelectItem value="MST">MST (UTC-7)</SelectItem>
                  <SelectItem value="PST">PST (UTC-8)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={preferences.theme} onValueChange={(v: any) => setPreferences({ ...preferences, theme: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notifications</Label>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={preferences.notifications_enabled}
                  onCheckedChange={(v) => setPreferences({ ...preferences, notifications_enabled: v })}
                />
                <span className="text-sm">{preferences.notifications_enabled ? "Enabled" : "Disabled"}</span>
              </div>
            </div>
          </div>

          <Button onClick={handlePreferencesSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Preferences
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-red-600" />
            <div>
              <CardTitle className="text-lg">Security</CardTitle>
              <CardDescription>Manage your password</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {passwordSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{passwordSuccess}</AlertDescription>
            </Alert>
          )}

          {passwordError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{passwordError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={form.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">Current Password</Label>
              <Input
                id="current"
                type="password"
                placeholder="••••••••"
                {...form.register("current_password")}
              />
              {form.formState.errors.current_password && (
                <p className="text-sm text-red-500">{form.formState.errors.current_password.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new">New Password</Label>
                <Input
                  id="new"
                  type="password"
                  placeholder="••••••••"
                  {...form.register("new_password")}
                />
                {form.formState.errors.new_password && (
                  <p className="text-sm text-red-500">{form.formState.errors.new_password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  {...form.register("new_password_confirmation")}
                />
                {form.formState.errors.new_password_confirmation && (
                  <p className="text-sm text-red-500">{form.formState.errors.new_password_confirmation.message}</p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={form.formState.isSubmitting} className="gap-2">
              {form.formState.isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
};

export default Settings;
