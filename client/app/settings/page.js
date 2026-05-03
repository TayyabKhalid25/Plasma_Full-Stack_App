"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  User, Mail, Lock, Bell, BellOff, Eye, EyeOff, Link2, Unlink, Shield,
  Trash2, Download, Save, Check, ChevronRight, ChevronDown, ChevronUp, Camera, Loader2, RotateCcw
} from "lucide-react";
import { useModal } from "@/hooks/useModal";
import { ChangePasswordModal } from "@/components/modals/ChangePasswordModal";
import { UploadAvatarModal } from "@/components/modals/UploadAvatarModal";
import { ConfirmActionModal } from "@/components/modals/ConfirmActionModal";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { getAvatarUrl } from "@/lib/utils";

const sectionNav = [
  { id: "general", label: "General", icon: User },
  { id: "danger", label: "Danger Zone", icon: Trash2 },
];

function ToggleSwitch({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${enabled ? "bg-plasma-primary" : "bg-plasma-slate-hover"}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-b-0">
      <div className="pr-8">
        <p className="text-sm font-medium text-plasma-text-primary">{label}</p>
        {description && <p className="text-xs text-plasma-text-secondary mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general");
  const [profileSaved, setProfileSaved] = useState(false);
  const { token, logout, user, fetchUser } = useAuth();
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isSyncingAvatar, setIsSyncingAvatar] = useState(false);

  // Account state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");

  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
  });

  const mapPrivacyFromDb = (val) => {
    const v = (val || "Public").toLowerCase();
    return v === "friends only" ? "friends" : v;
  };

  const mapPrivacyToDb = (val) => {
    return val === "friends" ? "Friends Only" : val.charAt(0).toUpperCase() + val.slice(1);
  };

  const passwordModal = useModal();
  const avatarModal = useModal();
  const syncModal = useModal();
  const dangerModal = useModal();

  // Populate account from auth context user
  useEffect(() => {
    if (!user) return;
    setUsername(user.name || user.username || "");
    setEmail(user.email || "");
    setAvatar(user.avatar || null);
  }, [user]);

  // Fetch settings from API
  useEffect(() => {
    if (!token) return;
    const loadSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setNotificationsEnabled(data.data.notificationsEnabled ?? true);
          setPrivacy({ profileVisibility: mapPrivacyFromDb(data.data.privacy) });
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      } finally {
        setIsFetching(false);
      }
    };
    loadSettings();
  }, [token]);

  const handleAutoSave = useCallback(async (updates) => {
    try {
      const currentNotif = updates.notificationsEnabled ?? notificationsEnabled;
      const currentPrivacy = updates.privacy ?? privacy.profileVisibility;
      
      await fetch(`${API_BASE}/api/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          notificationsEnabled: currentNotif,
          timezone: "UTC",
          privacy: mapPrivacyToDb(currentPrivacy),
        })
      });
    } catch (err) {
      console.error("Auto-save failed", err);
    }
  }, [token, notificationsEnabled, privacy.profileVisibility]);

  const toggleNotif = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    handleAutoSave({ notificationsEnabled: newValue });
  };

  const handlePrivacyChange = (val) => {
    setPrivacy({ profileVisibility: val });
    handleAutoSave({ privacy: val });
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    setProfileSaved(false);
    setError(null);

    try {
      // Manual save only handles Username/Profile updates
      const profileRes = await fetch(`${API_BASE}/api/users/me/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username: username || undefined,
          avatarURL: avatar || undefined,
        })
      });
      
      const profileData = await profileRes.json();
      if (!profileRes.ok || !profileData.success) {
        throw new Error(profileData.message || "Failed to update profile");
      }

      if (fetchUser && token) await fetchUser(token);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        logout();
      }
    } catch (err) {
      console.error("Failed to delete account", err);
    }
  };

  const handleSteamAvatarSync = async () => {
    setIsSyncingAvatar(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/steam/sync/avatar-force`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to sync avatar");
      
      if (fetchUser) await fetchUser(token);
      // No longer setting profileSaved here to avoid UI confusion
    } catch (err) {
      console.error("Sync error:", err);
      setError(err.message);
    } finally {
      setIsSyncingAvatar(false);
    }
  };

  if (isFetching) {
    return (
      <DashboardLayout showRightRail={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-plasma-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout showRightRail={false}>
      <div className="max-w-5xl mx-auto px-8 py-10 pb-20 animate-fade-in">
        <h1 className="font-display font-bold text-[32px] text-plasma-text-primary mb-8">Settings</h1>

        <div className="flex gap-8 flex-col lg:flex-row">
          {/* Left Nav */}
          <nav className="lg:w-56 shrink-0">
            <div className="lg:sticky lg:top-24 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 hide-scrollbar">
              {sectionNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? "bg-plasma-primary/15 text-plasma-primary border border-plasma-primary/25"
                        : "text-plasma-text-secondary hover:text-plasma-text-primary hover:bg-white/5 border border-transparent"
                    } ${item.id === "danger" ? "lg:mt-6" : ""}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Right Content */}
          <div className="flex-1 min-w-0">
            {activeSection === "general" && (
              <div className="space-y-6">
                {/* Account Section */}
                <section className="bg-plasma-slate rounded-2xl border border-white/5 p-6 animate-fade-in">
                  <h2 className="font-display font-bold text-lg text-plasma-text-primary mb-6">General Settings</h2>

                  {/* Avatar */}
                  <div className="flex items-center gap-6 mb-8 pb-8 border-b border-white/5">
                    <div className="relative">
                      <img
                        src={getAvatarUrl(avatar, username)}
                        alt="Avatar"
                        className="w-20 h-20 rounded-full border-2 border-plasma-primary bg-plasma-slate"
                      />
                      <button 
                        onClick={() => avatarModal.open()}
                        className="absolute bottom-0 right-0 p-1.5 bg-plasma-primary rounded-full text-white border-2 border-plasma-slate hover:bg-plasma-primary/90 transition-colors cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => avatarModal.open()} className="px-5 py-2 rounded-xl bg-plasma-primary/15 text-plasma-primary text-sm font-bold hover:bg-plasma-primary/25 transition-colors cursor-pointer">
                        Change Avatar
                      </button>
                      <button 
                        onClick={() => syncModal.open()} 
                        className="px-5 py-2 rounded-xl bg-[#1b2838] text-[#66c0f4] border border-[#66c0f4]/20 text-sm font-bold hover:bg-[#2a475e] transition-all cursor-pointer flex items-center gap-2"
                      >
                        {isSyncingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                        Sync Steam Avatar
                      </button>
                      <p className="text-xs text-plasma-text-secondary mt-1.5 w-full">JPG, PNG. Max 2MB.</p>
                    </div>
                  </div>

                  {/* Username + Save Button */}
                  <div className="flex items-center gap-4 py-4 border-b border-white/5">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-plasma-text-primary">Username</p>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-plasma-bg border border-white/10 rounded-lg px-4 py-2 mt-2 text-sm text-plasma-text-primary outline-none focus:border-plasma-primary transition-colors w-full max-w-md"
                      />
                    </div>
                    <div className="pt-6">
                      <button
                        onClick={handleManualSave}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm transition-all cursor-pointer disabled:opacity-50 ${
                          profileSaved
                            ? "bg-plasma-success text-white"
                            : "bg-primary-gradient text-white hover:shadow-card-glow hover:scale-[1.02]"
                        }`}
                      >
                        {isSaving ? "Saving..." : profileSaved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save</>}
                      </button>
                    </div>
                  </div>

                  {/* Email */}
                  <SettingRow label="Email Address" description="Email cannot be changed here.">
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="bg-plasma-bg/50 border border-white/5 rounded-lg px-4 py-2 text-sm text-plasma-text-secondary outline-none cursor-not-allowed w-64"
                    />
                  </SettingRow>

                  {/* Password */}
                  <SettingRow label="Password" description="Last changed 30 days ago">
                    <button onClick={() => passwordModal.open()} className="px-4 py-2 rounded-lg border border-white/10 text-sm text-plasma-text-secondary hover:text-white hover:border-white/20 transition-colors cursor-pointer">
                      Change Password
                    </button>
                  </SettingRow>

                  {/* Notifications (Merged) */}
                  <div className="pt-6 mt-6 border-t border-white/10">
                    <h3 className="text-xs font-bold text-plasma-text-secondary uppercase tracking-widest mb-4">Preferences</h3>
                    <SettingRow label="Global Notifications" description="Enable or disable all notifications across Plasma">
                      <ToggleSwitch enabled={notificationsEnabled} onToggle={toggleNotif} />
                    </SettingRow>

                    <SettingRow label="Profile Visibility" description="Who can see your profile page">
                      <div className="relative">
                        <select
                          value={privacy.profileVisibility}
                          onMouseDown={() => setIsSelectOpen(!isSelectOpen)}
                          onBlur={() => setIsSelectOpen(false)}
                          onChange={(e) => {
                            handlePrivacyChange(e.target.value);
                            setIsSelectOpen(false);
                            e.target.blur();
                          }}
                          className="bg-plasma-bg border border-white/10 rounded-lg pl-4 pr-10 py-2 text-sm text-plasma-text-primary outline-none cursor-pointer appearance-none focus:border-plasma-primary transition-colors"
                        >
                          <option value="public">Public</option>
                          <option value="friends">Friends Only</option>
                          <option value="private">Private</option>
                        </select>
                        <ChevronDown className={`w-4 h-4 text-plasma-text-secondary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200 ${isSelectOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </SettingRow>
                  </div>
                </section>

                {error && (
                  <p className="text-xs font-bold text-plasma-error bg-plasma-error/10 px-4 py-2 rounded-lg border border-plasma-error/20 animate-fade-in">
                    {error}
                  </p>
                )}
              </div>
            )}

            {/* Danger Zone */}
            {activeSection === "danger" && (
              <section className="bg-plasma-slate rounded-2xl border border-plasma-error/20 p-6 animate-fade-in">
                <h2 className="font-display font-bold text-lg text-plasma-error mb-2">Danger Zone</h2>
                <p className="text-sm text-plasma-text-secondary mb-6">These actions are irreversible. Please proceed with caution.</p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-plasma-error/20 bg-plasma-error/5">
                    <div>
                      <p className="text-sm font-medium text-plasma-error">Delete Account</p>
                      <p className="text-xs text-plasma-text-secondary">Permanently delete your account and all data</p>
                    </div>
                    <button 
                      onClick={() => dangerModal.open({ 
                        title: 'Delete Account', 
                        message: 'This will permanently delete your account, posts, and history. This action cannot be undone.', 
                        requiredString: 'DELETE' 
                      })}
                      className="px-4 py-2 rounded-lg bg-plasma-error text-white text-sm font-bold hover:bg-plasma-error/80 transition-colors cursor-pointer"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      <ChangePasswordModal 
        isOpen={passwordModal.isOpen} 
        onClose={passwordModal.close} 
      />
      <UploadAvatarModal 
        isOpen={avatarModal.isOpen} 
        onClose={avatarModal.close} 
        currentAvatar={avatar}
        onUpload={(newAvatar) => {
          setAvatar(newAvatar);
          // Auto-save avatar when uploaded
          fetch(`${API_BASE}/api/users/me/profile`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ avatarURL: newAvatar })
          }).then(() => fetchUser && fetchUser(token));
        }}
      />
      <ConfirmActionModal 
        isOpen={dangerModal.isOpen} 
        onClose={dangerModal.close}
        title={dangerModal.modalData?.title}
        message={dangerModal.modalData?.message}
        requiredString={dangerModal.modalData?.requiredString}
        onConfirm={handleDeleteAccount}
      />
      <ConfirmActionModal 
        isOpen={syncModal.isOpen} 
        onClose={syncModal.close}
        title="Sync Steam Avatar"
        message="This will fetch your latest public avatar from Steam and overwrite your current Plasma avatar. This action cannot be easily undone if you haven't backed up your current image."
        requiredString="SYNC"
        actionType="info"
        onConfirm={handleSteamAvatarSync}
      />
    </DashboardLayout>
  );
}
