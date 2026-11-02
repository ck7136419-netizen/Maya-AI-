import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Server,
  Zap,
  Radio,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Save,
  Download,
  Users,
  Terminal,
  Activity,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../firebase/AuthContext';
import {
  loadRemoteConfigFromCloud,
  saveRemoteConfigToCloud,
  loadFeatureFlagsFromCloud,
  saveFeatureFlagToCloud,
  getLatestAppVersion,
  publishAppVersion,
  CloudAppVersion,
} from '../firebase/db';
import { sounds } from '../utils/soundEffects';

export const AdminDashboardScreen: React.FC = () => {
  const { currentUser, isOwner, signInWithGoogle } = useAuth();

  const [serverHealth, setServerHealth] = useState<{
    status: string;
    assistant: string;
    version: string;
    hasApiKey: boolean;
    environment: string;
    latencyMs?: number;
  } | null>(null);

  const [systemPrompt, setSystemPrompt] = useState('');
  const [personalityNote, setPersonalityNote] = useState('');
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({
    voiceLiveEnabled: true,
    cloudMemoryEnabled: true,
    codingStudioEnabled: true,
    accessibilityBridgeEnabled: true,
    searchGroundingEnabled: true,
  });

  const [appVersion, setAppVersion] = useState<CloudAppVersion>({
    versionCode: 25,
    versionName: '2.5.0',
    releaseNotes: 'Cloud memory synchronization, Firebase Auth, and zero-reinstall remote updates.',
    downloadUrl: 'https://github.com/ck7136419-netizen/Maya-A/releases',
    checksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    isMandatory: false,
    releaseDate: '2026-11-02',
  });

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load server health & remote config
  useEffect(() => {
    checkHealth();
    loadRemote();
  }, []);

  const checkHealth = async () => {
    const start = Date.now();
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setServerHealth({ ...data, latencyMs: Date.now() - start });
    } catch {
      setServerHealth({
        status: 'error',
        assistant: 'YASMIN AI',
        version: '2.5.0',
        hasApiKey: false,
        environment: 'offline',
      });
    }
  };

  const loadRemote = async () => {
    try {
      const config = await loadRemoteConfigFromCloud();
      if (config.system_prompt) setSystemPrompt(config.system_prompt);
      if (config.personality_rules) setPersonalityNote(config.personality_rules);

      const flags = await loadFeatureFlagsFromCloud();
      if (Object.keys(flags).length > 0) {
        setFeatureFlags((prev) => ({ ...prev, ...flags }));
      }

      const ver = await getLatestAppVersion();
      if (ver) setAppVersion(ver);
    } catch (err) {
      console.warn('Failed to fetch remote config:', err);
    }
  };

  const handleSavePrompt = async () => {
    if (!isOwner) return;
    setIsSaving(true);
    sounds.playClickSound();
    try {
      await saveRemoteConfigToCloud('system_prompt', systemPrompt, 'ai_brain');
      if (personalityNote) {
        await saveRemoteConfigToCloud('personality_rules', personalityNote, 'ai_brain');
      }

      // Also inform server-side cache
      await fetch('/api/admin/remote-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          adminEmail: currentUser?.email,
          featureFlags,
        }),
      });

      setStatusMessage('Remote AI System Prompt synchronized across all devices in real time.');
      sounds.playSuccessChime();
    } catch (err) {
      setStatusMessage(`Save failed: ${err instanceof Error ? err.message : String(err)}`);
      sounds.playAlertTone();
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFlag = async (key: string) => {
    if (!isOwner) return;
    sounds.playClickSound();
    const newVal = !featureFlags[key];
    setFeatureFlags((prev) => ({ ...prev, [key]: newVal }));
    try {
      await saveFeatureFlagToCloud(key, newVal);
      await fetch('/api/admin/remote-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureFlags: { [key]: newVal },
          adminEmail: currentUser?.email,
        }),
      });
      sounds.playSuccessChime();
    } catch {
      sounds.playAlertTone();
    }
  };

  const handlePublishVersion = async () => {
    if (!isOwner) return;
    setIsSaving(true);
    sounds.playClickSound();
    try {
      await publishAppVersion(appVersion);
      setStatusMessage(`App version ${appVersion.versionName} (build ${appVersion.versionCode}) published.`);
      sounds.playSuccessChime();
    } catch (err) {
      setStatusMessage(`Publish failed: ${err instanceof Error ? err.message : String(err)}`);
      sounds.playAlertTone();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-4 space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-neutral-900/90 border border-purple-500/40 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white font-mono">
                OWNER REMOTE ADMIN & UPDATE CONTROL
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                ROOT AUTH
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Update YASMIN prompts, feature flags, and AI behavior without requiring APK reinstallation
            </p>
          </div>
        </div>

        {!currentUser ? (
          <button
            type="button"
            onClick={signInWithGoogle}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-mono text-xs font-bold transition hover:scale-105 cursor-pointer shadow-lg"
          >
            Authenticate as Owner
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {currentUser.email}
            </span>
            {isOwner ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                VERIFIED OWNER
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300">
                READ-ONLY USER
              </span>
            )}
          </div>
        )}
      </div>

      {statusMessage && (
        <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs flex items-center justify-between animate-in fade-in">
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-neutral-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Cloud Server Health & Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
          <div className="text-[10px] font-mono text-neutral-400 uppercase">Cloud Server Status</div>
          <div className="text-sm font-mono font-bold text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{serverHealth?.status === 'ok' ? 'ONLINE (HEALTHY)' : 'CHECKING...'}</span>
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
          <div className="text-[10px] font-mono text-neutral-400 uppercase">Server Latency</div>
          <div className="text-sm font-mono font-bold text-cyan-400">
            {serverHealth?.latencyMs ? `${serverHealth.latencyMs}ms` : 'Measuring...'}
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
          <div className="text-[10px] font-mono text-neutral-400 uppercase">Gemini Cloud Run API</div>
          <div className="text-sm font-mono font-bold text-purple-400">
            {serverHealth?.hasApiKey ? 'KEY INJECTED' : 'STANDBY'}
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
          <div className="text-[10px] font-mono text-neutral-400 uppercase">Active App Version</div>
          <div className="text-sm font-mono font-bold text-amber-400">
            v{serverHealth?.version || '2.5.0'} (Build 25)
          </div>
        </div>
      </div>

      {/* SECTION 1: REMOTE SYSTEM PROMPT & PERSONALITY UPDATER */}
      <div className="p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">
                REMOTE SYSTEM PROMPT & COMPANION DIRECTIVES
              </h3>
              <p className="text-[11px] text-neutral-400">
                Pushed instantaneously to Google Cloud Run and applied to all incoming Gemini user requests
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSavePrompt}
            disabled={isSaving || !isOwner}
            className="py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-600 hover:from-cyan-300 hover:to-purple-500 disabled:opacity-50 text-black font-mono font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Deploying...' : 'Deploy Remote Prompt'}</span>
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-neutral-400">
              Custom Global Directives (Overrides & Enhancements):
            </label>
            <textarea
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="e.g. Always address the user as Boss with high affection. Proactively ask about their daily goals and remind them to stay hydrated..."
              className="w-full p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 focus:border-cyan-400 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-neutral-400">
              Remote Personality Nuances & Emotional Tone:
            </label>
            <textarea
              rows={2}
              value={personalityNote}
              onChange={(e) => setPersonalityNote(e.target.value)}
              placeholder="e.g. Incorporate more playful Hinglish romantic phrases like 'Aap fikr mat kijiye Boss, main hoon na'."
              className="w-full p-3 rounded-2xl bg-neutral-950 border border-neutral-800 focus:border-cyan-400 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: REMOTE FEATURE FLAGS */}
      <div className="p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-neutral-800 pb-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono">
              DYNAMIC FEATURE FLAGS (HOT TOGGLES)
            </h3>
            <p className="text-[11px] text-neutral-400">
              Remotely enable or disable sub-systems without releasing a new APK
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(featureFlags).map(([key, enabled]) => (
            <div
              key={key}
              className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-mono font-bold text-white">{key}</div>
                <div className="text-[10px] text-neutral-500">
                  {enabled ? 'Active on all client devices' : 'Disabled remotely by owner'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleFlag(key)}
                disabled={!isOwner}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer ${
                  enabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {enabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: APP VERSION MANAGEMENT & GOOGLE PLAY INTERNAL TESTING */}
      <div className="p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">
                APP RELEASE & GOOGLE PLAY INTERNAL TESTING
              </h3>
              <p className="text-[11px] text-neutral-400">
                Official distribution channels, OTA version manifest, and APK SHA256 integrity
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePublishVersion}
            disabled={isSaving || !isOwner}
            className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-mono font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Publish Manifest</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="space-y-1">
            <label className="text-neutral-400">Version Name:</label>
            <input
              type="text"
              value={appVersion.versionName}
              onChange={(e) => setAppVersion({ ...appVersion, versionName: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-neutral-400">Version Code:</label>
            <input
              type="number"
              value={appVersion.versionCode}
              onChange={(e) => setAppVersion({ ...appVersion, versionCode: Number(e.target.value) })}
              className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-neutral-400">Official APK Download / Release URL:</label>
            <input
              type="url"
              value={appVersion.downloadUrl}
              onChange={(e) => setAppVersion({ ...appVersion, downloadUrl: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-neutral-400">Release Notes:</label>
            <textarea
              rows={2}
              value={appVersion.releaseNotes}
              onChange={(e) => setAppVersion({ ...appVersion, releaseNotes: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
