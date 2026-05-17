"use client";

import AppShell from "@/components/app-shell";
import { motion } from "framer-motion";
import { Settings, User, Bell, Palette, Shield, LogOut } from "lucide-react";
import { useAuthStore } from "@/lib/store";

export default function SettingsPage() {
  const { user, logout } = useAuthStore();

  return (
    <AppShell>
      <div className="page-container max-w-3xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="page-header">
          <h1 className="page-title"><span className="gradient-text">Settings</span></h1>
          <p className="page-subtitle">Manage your account and preferences</p>
        </motion.div>

        <div className="space-y-6">
          {/* Profile */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
            <h2 className="font-semibold flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary" /> Profile
            </h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
                {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="font-semibold text-lg">{user?.full_name || "User"}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Full Name</label>
                <input type="text" defaultValue={user?.full_name || ""} className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <input type="email" defaultValue={user?.email || ""} className="input-field" disabled />
              </div>
            </div>
            <button className="btn-primary mt-4">Save Changes</button>
          </motion.div>

          {/* Preferences */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
            <h2 className="font-semibold flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-primary" /> Preferences
            </h2>
            <div className="space-y-4">
              {[
                { label: "Dark Mode", desc: "Use dark theme across the platform", enabled: true },
                { label: "Adaptive Learning", desc: "Allow AI to automatically adjust your roadmap", enabled: true },
                { label: "Study Reminders", desc: "Get notifications to maintain your streak", enabled: false },
              ].map((pref) => (
                <div key={pref.label} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div>
                    <p className="text-sm font-medium">{pref.label}</p>
                    <p className="text-xs text-muted-foreground">{pref.desc}</p>
                  </div>
                  <div className={`w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${
                    pref.enabled ? "bg-primary" : "bg-secondary"
                  }`}>
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      pref.enabled ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Danger Zone */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 border-destructive/20">
            <h2 className="font-semibold flex items-center gap-2 mb-4 text-destructive">
              <Shield className="w-5 h-5" /> Account
            </h2>
            <button
              onClick={() => { logout(); window.location.href = "/login"; }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
