import React, { useState } from 'react';
import { showToastGlobal } from '../../../hooks/useToast';
import { ArrowLeft, Moon, Sun, Monitor, Bell, HardDrive, Download, Trash2, HelpCircle, FileText, ExternalLink, Activity, BookOpen, Bot, LogOut, User, UserMinus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import useThemeStore from '../../../store/themeStore';
import { APP_VERSION } from '../../../constants/version';

function Settings({ onLogout }) {
    const navigate = useNavigate();
    // Global state for theme
    const { theme, setTheme } = useThemeStore();
    const [notifications, setNotifications] = useState({
        readingReminders: true,
        streakAlerts: true,
        studyTips: false,
    });
    const [readingPrefs, setReadingPrefs] = useState({
        autoSave: true,
        pageAnimation: true,
    });
    const [aiPrefs, setAiPrefs] = useState({
        autoExplain: false,
        saveHistory: true,
    });

    const handleToggle = (setter, key, value) => {
        setter(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className='w-full min-h-screen bg-bg-primary overflow-y-auto pb-24'>
            {/* Header */}
            <div className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-xl border-b border-border-default">
                <div className="flex items-center justify-between p-4 max-w-3xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-bg-subtle rounded-xl transition-all"
                    >
                        <ArrowLeft className='text-text-primary' size={24} />
                    </button>
                    <h2 className='text-lg font-bold font-display text-text-primary absolute left-1/2 -translate-x-1/2'>Settings</h2>
                    <div className="w-10"></div> {/* Spacer for centering */}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Appearance */}
                <SettingSection title="Appearance" icon={<Moon size={18} />}>
                    <div className="flex items-center justify-between p-4 border-b border-border-default last:border-0 hover:bg-bg-subtle/50 transition-colors">
                        <div>
                            <p className="text-sm font-medium text-text-primary">Theme</p>
                            <p className="text-xs text-text-tertiary mt-0.5">Select your app theme</p>
                        </div>
                        <div className="flex bg-bg-elevated/50 p-1 rounded-xl border border-border-default shadow-inner">
                            <button
                                onClick={() => setTheme('light')}
                                className={`p-2 rounded-lg transition-all ${theme === 'light' ? 'bg-bg-primary shadow-sm text-accent-primary border border-border-default' : 'text-text-tertiary hover:text-text-primary border border-transparent'}`}
                                title="Light Theme"
                            >
                                <Sun size={16} />
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-bg-primary shadow-sm text-accent-primary border border-border-default' : 'text-text-tertiary hover:text-text-primary border border-transparent'}`}
                                title="Dark Theme"
                            >
                                <Moon size={16} />
                            </button>
                            <button
                                onClick={() => setTheme('system')}
                                className={`p-2 rounded-lg transition-all ${theme === 'system' ? 'bg-bg-primary shadow-sm text-accent-primary border border-border-default' : 'text-text-tertiary hover:text-text-primary border border-transparent'}`}
                                title="System Default"
                            >
                                <Monitor size={16} />
                            </button>
                        </div>
                    </div>
                </SettingSection>

                {/* Reading Preferences */}
                <SettingSection title="Reading" icon={<BookOpen size={18} />}>
                    <ToggleRow
                        label="Auto-save Progress"
                        desc="Automatically save where you left off"
                        checked={readingPrefs.autoSave}
                        onChange={(e) => handleToggle(setReadingPrefs, 'autoSave', e.target.checked)}
                    />
                    <ToggleRow
                        label="Page Animations"
                        desc="Show animations when turning pages"
                        checked={readingPrefs.pageAnimation}
                        onChange={(e) => handleToggle(setReadingPrefs, 'pageAnimation', e.target.checked)}
                    />
                </SettingSection>

                {/* AI & Chatbot */}
                <SettingSection title="AI Companion" icon={<Bot size={18} />}>
                    <ToggleRow
                        label="Save Chat History"
                        desc="Keep a record of your AI conversations"
                        checked={aiPrefs.saveHistory}
                        onChange={(e) => handleToggle(setAiPrefs, 'saveHistory', e.target.checked)}
                    />
                    <ToggleRow
                        label="Auto-Explain Highlights"
                        desc="Automatically open AI when text is highlighted"
                        checked={aiPrefs.autoExplain}
                        onChange={(e) => handleToggle(setAiPrefs, 'autoExplain', e.target.checked)}
                    />
                </SettingSection>

                {/* Notifications */}
                <SettingSection title="Notifications" icon={<Bell size={18} />}>
                    <ToggleRow
                        label="Reading Reminders"
                        desc="Get notified to meet your daily reading goals"
                        checked={notifications.readingReminders}
                        onChange={(e) => handleToggle(setNotifications, 'readingReminders', e.target.checked)}
                    />
                    <ToggleRow
                        label="Streak Alerts"
                        desc="Reminders to keep your reading streak alive"
                        checked={notifications.streakAlerts}
                        onChange={(e) => handleToggle(setNotifications, 'streakAlerts', e.target.checked)}
                    />
                    <ToggleRow
                        label="Study Tips"
                        desc="Occasional learning strategies and tips"
                        checked={notifications.studyTips}
                        onChange={(e) => handleToggle(setNotifications, 'studyTips', e.target.checked)}
                    />
                </SettingSection>

                {/* Data & Storage */}
                <SettingSection title="Data & Storage" icon={<HardDrive size={18} />}>
                    <ActionRow
                        icon={<Download size={16} className="text-text-secondary" />}
                        label="Export Data"
                        desc="Download your bookmarks and reading history"
                        onClick={() => showToastGlobal('Exporting data feature coming soon!', 'info')}
                    />
                    {/* <ActionRow
                        icon={<Trash2 size={16} className="text-error" />}
                        label="Clear AI History"
                        desc="Permanently delete all AI chat logs"
                        onClick={() => window.confirm("Are you sure you want to clear all AI history?")}
                        danger={true}
                    /> */}
                    <ActionRow
                        icon={<Trash2 size={16} className="text-error" />}
                        label="Clear App Data"
                        desc="Erase all books and progress from this browser"
                        onClick={() => window.confirm("Are you sure you want to completely erase all data? This cannot be undone.")}
                        danger={true}
                    />
                </SettingSection>

                {/* Account */}
                <SettingSection title="Account" icon={<User size={18} />}>
                    <ActionRow
                        icon={<LogOut size={16} className="text-error" />}
                        label="Log Out"
                        desc="Sign out of your account on this device"
                        onClick={() => {
                            if (onLogout) {
                                onLogout();
                            } else {
                                navigate('/');
                            }
                        }}
                        danger={true}
                    />
                    <ActionRow
                        icon={<UserMinus size={16} className="text-error" />}
                        label="Delete Account"
                        desc="Permanently delete your account and all data"
                        onClick={() => window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")}
                        danger={true}
                    />
                </SettingSection>

                {/* About */}
                <SettingSection title="About" icon={<HelpCircle size={18} />}>
                    <ActionRow
                        icon={<FileText size={16} className="text-text-secondary" />}
                        label="Terms & Privacy"
                        onClick={() => { }}
                    />
                    <ActionRow
                        icon={<ExternalLink size={16} className="text-text-secondary" />}
                        label="Help Center"
                        onClick={() => { }}
                    />
                    <div className="p-4 text-center">
                        <p className="text-xs text-text-tertiary">Apex App Version {APP_VERSION}</p>
                    </div>
                </SettingSection>

            </div>
        </div>
    );
}

// Subcomponents for consistency
const SettingSection = ({ title, icon, children }) => (
    <div className="bg-card-glass backdrop-blur-md border-2 border-border-default rounded-3xl overflow-hidden hover:border-text-tertiary/20 transition-all shadow-sm">
        <div className="px-5 py-3 border-b border-border-default bg-bg-elevated/50 flex items-center gap-2">
            <div className="text-accent-primary p-1.5 bg-accent-primary/10 rounded-lg">
                {icon}
            </div>
            <h3 className="font-semibold text-text-primary text-sm tracking-wide">{title}</h3>
        </div>
        <div className="flex flex-col">
            {children}
        </div>
    </div>
);

const ToggleRow = ({ label, desc, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 border-b border-border-default last:border-0 hover:bg-bg-subtle/50 transition-colors">
        <div className="pr-4">
            <p className="text-sm font-medium text-text-primary">{label}</p>
            {desc && <p className="text-xs text-text-tertiary mt-0.5 leading-relaxed">{desc}</p>}
        </div>
        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
            <div className={`w-11 h-6 bg-border-default peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary`}></div>
        </label>
    </div>
);

const ActionRow = ({ label, desc, icon, onClick, danger = false }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 border-b border-border-default last:border-0 hover:bg-bg-subtle/50 transition-colors text-left"
    >
        <div className="flex items-center gap-3">
            {icon && (
                <div className={`p-2 rounded-lg ${danger ? 'bg-error/10 text-error' : 'bg-bg-subtle text-text-secondary'}`}>
                    {icon}
                </div>
            )}
            <div>
                <p className={`text-sm font-medium ${danger ? 'text-error' : 'text-text-primary'}`}>{label}</p>
                {desc && <p className={`text-xs mt-0.5 ${danger ? 'text-error/70' : 'text-text-tertiary leading-relaxed'}`}>{desc}</p>}
            </div>
        </div>
    </button>
);

export default Settings;
