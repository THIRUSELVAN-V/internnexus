'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Settings, ShieldCheck, Check, Loader2, Save, Sparkles, Bell } from 'lucide-react';
import { getDocument, setDocument } from '@/lib/firebase/firestore';

interface SystemSettingsData {
  requireCompanyApproval: boolean;
  allowPublicCompanyView: boolean;
  showAiMatchScores: boolean;
  defaultMaxMentees: number;
  supportEmail: string;
  systemNotice: string;
}

const defaultSettings: SystemSettingsData = {
  requireCompanyApproval: true,
  allowPublicCompanyView: true,
  showAiMatchScores: true,
  defaultMaxMentees: 5,
  supportEmail: 'support@internnexus.com',
  systemNotice: '',
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const docData = await getDocument<SystemSettingsData>('system_settings', 'global');
        if (docData) {
          setSettings({
            requireCompanyApproval: docData.requireCompanyApproval ?? true,
            allowPublicCompanyView: docData.allowPublicCompanyView ?? true,
            showAiMatchScores: docData.showAiMatchScores ?? true,
            defaultMaxMentees: docData.defaultMaxMentees ?? 5,
            supportEmail: docData.supportEmail || 'support@internnexus.com',
            systemNotice: docData.systemNotice || '',
          });
        }
      } catch (err) {
        console.error('Error loading system settings:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      await setDocument('system_settings', 'global', settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving system settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <AdminPageHeader
        title="Platform System Settings"
        description="Configure global security controls, company auto-verification rules, AI guardrails, and system notifications."
        icon={Settings}
        badgeText="System Configuration"
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-sm text-slate-500 font-medium">Loading system configurations...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {savedSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <Check className="h-4 w-4 text-green-600 shrink-0" /> System settings have been saved and applied across InternNexus.
            </div>
          )}

          {/* Section 1: Company & Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" /> Verification & Governance Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Require Admin Approval for Companies</p>
                  <p className="text-xs text-slate-500">New HR & company accounts must be manually reviewed before posting jobs</p>
                </div>
                <Switch
                  checked={settings.requireCompanyApproval}
                  onCheckedChange={(checked) => setSettings((s) => ({ ...s, requireCompanyApproval: checked }))}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Allow Public Directory View</p>
                  <p className="text-xs text-slate-500">Enable unauthenticated visitors to browse verified company profiles</p>
                </div>
                <Switch
                  checked={settings.allowPublicCompanyView}
                  onCheckedChange={(checked) => setSettings((s) => ({ ...s, allowPublicCompanyView: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: AI & Mentor Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" /> AI Policy & Guardrails
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Human-in-the-Loop AI Guardrails</p>
                  <p className="text-xs text-slate-500">Enforces human final approval on all AI shortlist recommendations and task assignments</p>
                </div>
                <Switch checked={true} disabled />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Display Match Scores to HR Managers</p>
                  <p className="text-xs text-slate-500">Show AI-computed student resume match percentages on HR dashboards</p>
                </div>
                <Switch
                  checked={settings.showAiMatchScores}
                  onCheckedChange={(checked) => setSettings((s) => ({ ...s, showAiMatchScores: checked }))}
                />
              </div>

              <div className="pt-2 max-w-xs">
                <Label htmlFor="max-mentees" className="text-xs font-semibold text-slate-700">
                  Default Max Mentees Per Mentor
                </Label>
                <Input
                  id="max-mentees"
                  type="number"
                  min={1}
                  max={20}
                  value={settings.defaultMaxMentees}
                  onChange={(e) => setSettings((s) => ({ ...s, defaultMaxMentees: parseInt(e.target.value) || 5 }))}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Support & Global Broadcast */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-600" /> System Support & Global Broadcast
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-md">
                <Label htmlFor="support-email" className="text-xs font-semibold text-slate-700">
                  System Administrator Support Email
                </Label>
                <Input
                  id="support-email"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings((s) => ({ ...s, supportEmail: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="system-notice" className="text-xs font-semibold text-slate-700">
                  Global System Notice (Displays on User Dashboards)
                </Label>
                <Input
                  id="system-notice"
                  placeholder="Optional broadcast banner notice (e.g. Scheduled maintenance on Sunday)..."
                  value={settings.systemNotice}
                  onChange={(e) => setSettings((s) => ({ ...s, systemNotice: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Footer */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-6"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving Configuration...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Save System Settings
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
