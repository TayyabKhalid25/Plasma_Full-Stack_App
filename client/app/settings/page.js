"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  User, Mail, Lock, Bell, BellOff, Eye, EyeOff, Link2, Unlink, Shield,
  Trash2, Download, Save, Check, ChevronRight, Camera
} from "lucide-react";
import Image from "next/image";
import { userSettings as initialSettings } from "@/data/dummy";
import { useModal } from "@/hooks/useModal";
import { ChangePasswordModal } from "@/components/modals/ChangePasswordModal";
import { UploadAvatarModal } from "@/components/modals/UploadAvatarModal";
import { ConfirmActionModal } from "@/components/modals/ConfirmActionModal";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { useEffect } from "react";

const sectionNav = [
  { id: "account", label: "Account", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Shield },

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
  const [activeSection, setActiveSection] = useState("account");
  const [settings, setSettings] = useState(initialSettings);
  const [saved, setSaved] = useState(false);
  const { token, logout } = useAuth();
  const [isFetching, setIsFetching] = useState(true);

  const passwordModal = useModal();
  const avatarModal = useModal();
  const dangerModal = useModal();

  const handleAvatarUpload = (newAvatar) => {
    setSettings((s) => ({ ...s, account: { ...s.account, avatar: newAvatar } }));
  };

  useEffect(() => {
    if (!token) return;
    const loadSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setSettings(s => ({
            ...s,
            notificationsEnabled: data.data.notificationsEnabled,
            privacy: {
              ...s.privacy,
              profileVisibility: data.data.privacy.toLowerCase(),
            }
          }));
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      } finally {
        setIsFetching(false);
      }
    };
    loadSettings();
  }, [token]);

  const toggleNotif = () => {
    setSettings((s) => ({
      ...s,
      notificationsEnabled: !s.notificationsEnabled,
    }));
  };

  const togglePrivacy = (key) => {
    setSettings((s) => ({
      ...s,
      privacy: { ...s.privacy, [key]: !s.privacy[key] },
    }));
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          notificationsEnabled: settings.notificationsEnabled,
          timezone: "UTC",
          privacy: settings.privacy.profileVisibility === "public" ? "Public" : settings.privacy.profileVisibility === "friends" ? "Friends Only" : "Private"
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save settings", err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) return;
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
            {/* Account */}
            {activeSection === "account" && (
              <section className="bg-plasma-slate rounded-2xl border border-white/5 p-6 animate-fade-in">
                <h2 className="font-display font-bold text-lg text-plasma-text-primary mb-6">Account Settings</h2>

                {/* Avatar */}
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative">
                    <img
                      src={settings.account.avatar}
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
                  <div>
                    <button onClick={() => avatarModal.open()} className="px-5 py-2 rounded-xl bg-plasma-primary/15 text-plasma-primary text-sm font-bold hover:bg-plasma-primary/25 transition-colors cursor-pointer">
                      Change Avatar
                    </button>
                    <p className="text-xs text-plasma-text-secondary mt-1.5">JPG, PNG. Max 2MB.</p>
                  </div>
                </div>

                <SettingRow label="Username">
                  <input
                    type="text"
                    defaultValue={settings.account.username}
                    className="bg-plasma-bg border border-white/10 rounded-lg px-4 py-2 text-sm text-plasma-text-primary outline-none focus:border-plasma-primary transition-colors w-48"
                  />
                </SettingRow>

                <SettingRow label="Email Address">
                  <input
                    type="email"
                    defaultValue={settings.account.email}
                    className="bg-plasma-bg border border-white/10 rounded-lg px-4 py-2 text-sm text-plasma-text-primary outline-none focus:border-plasma-primary transition-colors w-48"
                  />
                </SettingRow>

                <SettingRow label="Password" description="Last changed 30 days ago">
                  <button onClick={() => passwordModal.open()} className="px-4 py-2 rounded-lg border border-white/10 text-sm text-plasma-text-secondary hover:text-white hover:border-white/20 transition-colors cursor-pointer">
                    Change Password
                  </button>
                </SettingRow>
              </section>
            )}

            {/* Notifications */}
            {activeSection === "notifications" && (
              <section className="bg-plasma-slate rounded-2xl border border-white/5 p-6 animate-fade-in">
                <h2 className="font-display font-bold text-lg text-plasma-text-primary mb-6">Notification Preferences</h2>

                <SettingRow label="Global Notifications" description="Enable or disable all notifications across Plasma">
                  <ToggleSwitch enabled={settings.notificationsEnabled} onToggle={toggleNotif} />
                </SettingRow>
              </section>
            )}

            {/* Privacy */}
            {activeSection === "privacy" && (
              <section className="bg-plasma-slate rounded-2xl border border-white/5 p-6 animate-fade-in">
                <h2 className="font-display font-bold text-lg text-plasma-text-primary mb-6">Privacy & Visibility</h2>

                <SettingRow label="Profile Visibility" description="Who can see your profile page">
                  <select
                    value={settings.privacy.profileVisibility}
                    onChange={(e) => setSettings((s) => ({ ...s, privacy: { ...s.privacy, profileVisibility: e.target.value } }))}
                    className="bg-plasma-bg border border-white/10 rounded-lg px-4 py-2 text-sm text-plasma-text-primary outline-none cursor-pointer"
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends Only</option>
                    <option value="private">Private</option>
                  </select>
                </SettingRow>

                <SettingRow label="Activity Visibility" description="Who can see your gaming activity">
                  <select
                    value={settings.privacy.activityVisibility}
                    onChange={(e) => setSettings((s) => ({ ...s, privacy: { ...s.privacy, activityVisibility: e.target.value } }))}
                    className="bg-plasma-bg border border-white/10 rounded-lg px-4 py-2 text-sm text-plasma-text-primary outline-none cursor-pointer"
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends Only</option>
                    <option value="private">Private</option>
                  </select>
                </SettingRow>

                <SettingRow label="Show Online Status" description="Let others see when you're online">
                  <ToggleSwitch enabled={settings.privacy.showOnlineStatus} onToggle={() => togglePrivacy("showOnlineStatus")} />
                </SettingRow>
              </section>
            )}




            {/* Danger Zone */}
            {activeSection === "danger" && (
              <section className="bg-plasma-slate rounded-2xl border border-plasma-error/20 p-6 animate-fade-in">
                <h2 className="font-display font-bold text-lg text-plasma-error mb-2">Danger Zone</h2>
                <p className="text-sm text-plasma-text-secondary mb-6">These actions are irreversible. Please proceed with caution.</p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-plasma-bg/50">
                    <div>
                      <p className="text-sm font-medium text-plasma-text-primary">Export Your Data</p>
                      <p className="text-xs text-plasma-text-secondary">Download a copy of all your Plasma data</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-sm text-plasma-text-primary hover:bg-white/5 transition-colors cursor-pointer">
                      <Download className="w-4 h-4" /> Export
                    </button>
                  </div>

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

            {/* Save Button */}
            {activeSection !== "danger" && (
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleSave}
                  className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm transition-all cursor-pointer ${
                    saved
                      ? "bg-plasma-success text-white"
                      : "bg-primary-gradient text-white hover:shadow-card-glow hover:scale-[1.02]"
                  }`}
                >
                  {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
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
        currentAvatar={settings.account.avatar}
        onUpload={handleAvatarUpload}
      />
      <ConfirmActionModal 
        isOpen={dangerModal.isOpen} 
        onClose={dangerModal.close}
        title={dangerModal.modalData?.title}
        message={dangerModal.modalData?.message}
        requiredString={dangerModal.modalData?.requiredString}
        onConfirm={handleDeleteAccount}
      />
    </DashboardLayout>
  );
}
