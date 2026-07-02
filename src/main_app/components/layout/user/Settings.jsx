import React, { useState } from 'react';
import { showToastGlobal } from '../../../hooks/useToast';
import {
  ArrowLeft, Moon, Sun, Monitor, Bell, HardDrives, DownloadSimple, Trash, Question,
  FileText, ArrowSquareOut, BookOpen, Robot, SignOut, User, UserMinus, SlidersHorizontal
} from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

import useThemeStore from '../../../store/themeStore';
import useSettingsStore from '../../../store/settingsStore';
import { APP_VERSION } from '../../../constants/version';
import ConfirmModal from '../../ui/ConfirmModal';
import db from '../../../db/apex.db';
import syncService from '../../../services/syncService';
import apiClient from '../../../services/apiClient';
import notificationService from '../../../services/notificationService';

function Settings({ onLogout }) {
    const navigate = useNavigate();
    // Global state for theme
    const { theme, setTheme } = useThemeStore();

    // Settings from store
    const {
      autoSaveProgress,
      pageAnimations,
      saveChatHistory,
      autoExplain,
      notifications,
      scrollOrientation,
      scrollAnimation,
      reminderTime,
      updateSetting,
      updateNotification,
    } = useSettingsStore();

    // Theme setter — updates both themeStore AND settingsStore
    const handleThemeChange = (newTheme) => {
      setTheme(newTheme);
      updateSetting('theme', newTheme);
    };

    // State for clear data confirmation modal
    const [showClearModal, setShowClearModal] = useState(false);
    const [clearing, setClearing] = useState(false);

    /**
     * clearDeviceOnly — Wipes all local Dexie data and localStorage
     * Cloud data is preserved. Pull sync runs after to restore from Supabase.
     */
    const handleClearDeviceOnly = async () => {
      setClearing(true);
      console.log('[Apex] Clearing device-only data...');
      try {
        // Clear all Dexie tables
        await db.books.clear();
        await db.highlights.clear();
        await db.bookmarks.clear();
        await db.reading_progress.clear();
        await db.sync_queue.clear();
        await db.chats.clear();

        // Clear localStorage except auth token
        const token = localStorage.getItem('apex_token');
        const cleanedFlag = localStorage.getItem('apex_db_cleaned');
        localStorage.clear();
        if (token) localStorage.setItem('apex_token', token);
        if (cleanedFlag) localStorage.setItem('apex_db_cleaned', cleanedFlag);

        console.log('[Apex] Device data cleared. Pulling from Supabase...');

        // Re-pull from Supabase to restore cloud data
        if (navigator.onLine) {
          await syncService.pullAllUserData();
        }

        showToastGlobal('Device data cleared. Your cloud data has been restored.', 'success');
      } catch (err) {
        console.error('[Apex] Failed to clear device data:', err);
        showToastGlobal('Failed to clear data. Please try again.', 'error');
      } finally {
        setClearing(false);
        setShowClearModal(false);
      }
    };

    /**
     * clearEverything — Wipes ALL data from both device AND Supabase
     * This is nuclear — books, files in Storage, highlights, bookmarks, progress — all gone.
     * AI conversations are preserved.
     */
    const handleClearEverything = async () => {
      setClearing(true);
      console.log('[Apex] Clearing ALL data — device and cloud...');
      try {
        // Step 1: Delete all books from Supabase
        // The backend cascade will handle highlights, bookmarks, reading_progress
        if (navigator.onLine) {
          console.log('[Apex] Deleting all books from Supabase...');
          try {
            await apiClient.delete('/api/books/all');
          } catch (err) {
            console.error('[Apex] Failed to delete books from Supabase:', err);
            // Continue with local clear even if cloud delete fails
          }
        }

        // Step 2: Clear all Dexie tables
        await db.books.clear();
        await db.highlights.clear();
        await db.bookmarks.clear();
        await db.reading_progress.clear();
        await db.sync_queue.clear();
        await db.chats.clear();

        // Step 3: Clear localStorage except auth token
        const token = localStorage.getItem('apex_token');
        const cleanedFlag = localStorage.getItem('apex_db_cleaned');
        localStorage.clear();
        if (token) localStorage.setItem('apex_token', token);
        if (cleanedFlag) localStorage.setItem('apex_db_cleaned', cleanedFlag);

        console.log('[Apex] All data cleared successfully');
        showToastGlobal('All data permanently deleted.', 'success');
      } catch (err) {
        console.error('[Apex] Failed to clear all data:', err);
        showToastGlobal('Failed to clear data. Please try again.', 'error');
      } finally {
        setClearing(false);
        setShowClearModal(false);
      }
    };



    return (
        <div className='w-full min-h-screen bg-bg-primary overflow-y-auto pb-24'>
            {/* Header */}
            <div className="sticky top-0 z-50 w-full px-4 md:px-8 py-3">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
                    <div className="px-1 py-1 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-white/20 dark:hover:bg-white/10 text-text-secondary rounded-full transition-all group flex items-center justify-center"
                        >
                            <ArrowLeft className='text-text-primary' size={24} weight="bold" />
                        </button>
                    </div>

                    <div className="px-5 py-2.5 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        <h2 className='text-base md:text-lg font-bold font-display text-text-primary'>Settings</h2>
                    </div>

                    <div className="w-[46px]" /> {/* Spacer for centering */}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Appearance */}
                <SettingSection title="Appearance" icon={<Moon size={18} weight="fill" />}>
                    <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10 last:border-0 hover:bg-bg-subtle/50 transition-colors">
                        <div>
                            <p className="text-sm font-medium text-text-primary">Theme</p>
                            <p className="text-xs text-text-tertiary mt-0.5">Select your app theme</p>
                        </div>
                        <div className="flex bg-bg-elevated/50 p-1 rounded-xl border border-black/10 dark:border-white/10 shadow-inner">
                            <button
                                onClick={() => handleThemeChange('light')}
                                className={`p-2 rounded-lg transition-all ${theme === 'light' ? 'bg-bg-primary shadow-sm text-accent-primary border border-transparent' : 'text-text-tertiary hover:text-text-primary border border-transparent'}`}
                                title="Light Theme"
                            >
                                <Sun size={16} weight="bold" />
                            </button>
                            <button
                                onClick={() => handleThemeChange('dark')}
                                className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-bg-primary shadow-sm text-accent-primary border border-transparent' : 'text-text-tertiary hover:text-text-primary border border-transparent'}`}
                                title="Dark Theme"
                            >
                                <Moon size={16} weight="bold" />
                            </button>
                            <button
                                onClick={() => handleThemeChange('system')}
                                className={`p-2 rounded-lg transition-all ${theme === 'system' ? 'bg-bg-primary shadow-sm text-accent-primary border border-transparent' : 'text-text-tertiary hover:text-text-primary border border-transparent'}`}
                                title="System Default"
                            >
                                <Monitor size={16} weight="bold" />
                            </button>
                        </div>
                    </div>
                </SettingSection>

                {/* Reading Preferences */}
                <SettingSection title="Reading" icon={<BookOpen size={18} weight="fill" />}>
                    <ToggleRow
                        label="Auto-save Progress"
                        desc="Automatically save your reading position to the cloud"
                        checked={autoSaveProgress}
                        onChange={(e) => updateSetting('autoSaveProgress', e.target.checked)}
                    />
                    <ToggleRow
                        label="Page Animations"
                        desc="Show animations when turning pages"
                        checked={pageAnimations}
                        onChange={(e) => updateSetting('pageAnimations', e.target.checked)}
                    />
                </SettingSection>

                {/* Reading Experience */}
                <SettingSection title="Reading Experience" icon={<SlidersHorizontal size={18} weight="bold" />}>
                  {/* Scroll Orientation */}
                  <div className="p-4 border-b border-black/10 dark:border-white/10">
                    <p className="text-sm font-medium text-text-primary mb-1">Scroll Direction</p>
                    <p className="text-xs text-text-tertiary mb-3">How you navigate between pages</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateSetting('scrollOrientation', 'vertical')}
                        className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                          scrollOrientation === 'vertical'
                            ? 'border-accent-primary bg-accent-primary/5 text-accent-primary'
                            : 'border-black/10 dark:border-white/10 text-text-tertiary hover:border-text-tertiary/30'
                        }`}
                      >
                        Up & Down
                      </button>
                      <button
                        onClick={() => updateSetting('scrollOrientation', 'horizontal')}
                        className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                          scrollOrientation === 'horizontal'
                            ? 'border-accent-primary bg-accent-primary/5 text-accent-primary'
                            : 'border-black/10 dark:border-white/10 text-text-tertiary hover:border-text-tertiary/30'
                        }`}
                      >
                        Left & Right
                      </button>
                    </div>
                  </div>

                  {/* Page Animation — only shows full choice if pageAnimations is ON */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-text-primary">Page Animation</p>
                        <p className="text-xs text-text-tertiary mt-0.5">Transition effect when turning pages</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={pageAnimations}
                          onChange={(e) => updateSetting('pageAnimations', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-black/10 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-transparent after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary" />
                      </label>
                    </div>

                    {/* Animation choice — only visible when pageAnimations is ON */}
                    {pageAnimations && (
                      <div className="grid grid-cols-2 gap-2 mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <button
                          onClick={() => updateSetting('scrollAnimation', 'slide')}
                          className={`flex flex-col items-center gap-2 p-3 rounded-card border-2 text-xs font-bold transition-all ${
                            scrollAnimation === 'slide'
                              ? 'border-accent-primary bg-accent-primary/5 text-accent-primary'
                              : 'border-black/10 dark:border-white/10 text-text-tertiary hover:border-text-tertiary/30'
                          }`}
                        >
                          {/* Smooth Slide icon — two rectangles sliding */}
                          <div className="relative w-8 h-6 overflow-hidden rounded">
                            <div className="absolute inset-0 bg-bg-subtle rounded border border-border-default" />
                            <div className="absolute inset-0 translate-x-1 bg-accent-primary/20 rounded border border-accent-primary/30" />
                          </div>
                          Smooth Slide
                        </button>
                        <button
                          onClick={() => updateSetting('scrollAnimation', 'fade')}
                          className={`flex flex-col items-center gap-2 p-3 rounded-card border-2 text-xs font-bold transition-all ${
                            scrollAnimation === 'fade'
                              ? 'border-accent-primary bg-accent-primary/5 text-accent-primary'
                              : 'border-black/10 dark:border-white/10 text-text-tertiary hover:border-text-tertiary/30'
                          }`}
                        >
                          {/* Fade icon — rectangle fading out */}
                          <div className="relative w-8 h-6">
                            <div className="absolute inset-0 bg-bg-subtle rounded border border-border-default opacity-40" />
                            <div className="absolute inset-0 bg-accent-primary/20 rounded border border-accent-primary/30 opacity-80" />
                          </div>
                          Fade Through
                        </button>
                      </div>
                    )}
                  </div>
                </SettingSection>

                {/* AI & Chatbot */}
                <SettingSection title="AI Companion" icon={<Robot size={18} weight="fill" />}>
                    <ToggleRow
                        label="Save Chat History"
                        desc="Keep a record of your AI conversations"
                        checked={saveChatHistory}
                        onChange={(e) => updateSetting('saveChatHistory', e.target.checked)}
                    />
                    <ToggleRow
                        label="Auto-Explain Highlights"
                        desc="Automatically open AI when text is highlighted"
                        checked={autoExplain}
                        onChange={(e) => updateSetting('autoExplain', e.target.checked)}
                    />
                </SettingSection>

                {/* Notifications */}
                <SettingSection title="Notifications" icon={<Bell size={18} weight="fill" />}>
                    {/* Reading Reminders toggle + time picker */}
                    <div className="border-b border-black/10 dark:border-white/10 last:border-0">
                      <div className="flex items-center justify-between p-4 hover:bg-bg-subtle/50 transition-colors">
                        <div className="pr-4">
                          <p className="text-sm font-medium text-text-primary">Reading Reminders</p>
                          <p className="text-xs text-text-tertiary mt-0.5 leading-relaxed">
                            Daily nudge to read and keep your streak alive
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notifications.readingReminders}
                            onChange={async (e) => {
                              const enabled = e.target.checked;
                              updateNotification('readingReminders', enabled);
                              const authToken = localStorage.getItem('apex_token');
                              if (enabled) {
                                const granted = await notificationService.requestPermission();
                                if (granted) {
                                  await notificationService.subscribeToPush(authToken);
                                }
                              } else {
                                await notificationService.unsubscribeFromPush(authToken);
                              }
                            }}
                          />
                          <div className="w-11 h-6 bg-black/10 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-transparent after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary" />
                        </label>
                      </div>

                      {/* Time picker — only visible when reminders are enabled */}
                      {notifications.readingReminders && (
                        <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="flex items-center justify-between bg-bg-elevated/50 rounded-xl px-4 py-3 border border-black/10 dark:border-white/10">
                            <div>
                              <p className="text-xs font-medium text-text-primary">Remind me at</p>
                              <p className="text-xs text-text-tertiary mt-0.5">Time is in your local timezone</p>
                            </div>
                            <input
                              type="time"
                              value={reminderTime}
                              onChange={(e) => updateSetting('reminderTime', e.target.value)}
                              className="bg-transparent text-accent-primary font-bold text-sm border-none outline-none cursor-pointer"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <ToggleRow
                        label="Study Tips"
                        desc="Occasional learning strategies and tips"
                        checked={notifications.studyTips}
                        onChange={(e) => updateNotification('studyTips', e.target.checked)}
                    />
                </SettingSection>

                {/* Data & Storage */}
                <SettingSection title="Data & Storage" icon={<HardDrives size={18} weight="bold" />}>
                    <ActionRow
                        icon={<DownloadSimple size={16} weight="bold" className="text-text-secondary" />}
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
                        icon={<Trash size={16} weight="bold" className="text-error" />}
                        label="Clear App Data"
                        desc="Erase books and progress from this device or everywhere"
                        onClick={() => setShowClearModal(true)}
                        danger={true}
                    />
                </SettingSection>

                {/* Account */}
                <SettingSection title="Account" icon={<User size={18} weight="bold" />}>
                    <ActionRow
                        icon={<SignOut size={16} weight="bold" className="text-error" />}
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
                        icon={<UserMinus size={16} weight="bold" className="text-error" />}
                        label="Delete Account"
                        desc="Permanently delete your account and all data"
                        onClick={() => window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")}
                        danger={true}
                    />
                </SettingSection>

                {/* About */}
                <SettingSection title="About" icon={<Question size={18} weight="bold" />}>
                    <ActionRow
                        icon={<FileText size={16} weight="bold" className="text-text-secondary" />}
                        label="Terms & Privacy"
                        onClick={() => { }}
                    />
                    <ActionRow
                        icon={<ArrowSquareOut size={16} weight="bold" className="text-text-secondary" />}
                        label="Help Center"
                        onClick={() => { }}
                    />
                    <div className="p-4 text-center">
                        <p className="text-xs text-text-tertiary">Apex App Version {APP_VERSION}</p>
                    </div>
                </SettingSection>

            </div>

            {/* Clear app data confirmation modal — two danger options */}
            <ConfirmModal
              isOpen={showClearModal}
              title="Clear App Data"
              message="Choose what you want to clear. Your AI conversation history will always be preserved."
              onClose={() => setShowClearModal(false)}
              actions={[
                {
                  label: clearing ? 'Clearing...' : 'Clear Device Only',
                  variant: 'primary',
                  onClick: handleClearDeviceOnly,
                },
                {
                  label: clearing ? 'Clearing...' : 'Clear Everything',
                  variant: 'danger',
                  onClick: handleClearEverything,
                },
                {
                  label: 'Cancel',
                  variant: 'ghost',
                  onClick: () => setShowClearModal(false),
                },
              ]}
            />
        </div>
    );
}

// Subcomponents for consistency
const SettingSection = ({ title, icon, children }) => (
    <div className="bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 rounded-card overflow-hidden hover:border-text-tertiary/20 dark:hover:border-text-tertiary-dark/20 transition-all shadow-sm hover:shadow-md duration-300">
        <div className="px-5 py-3 border-b border-black/10 dark:border-white/10 bg-transparent flex items-center gap-2">
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
    <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10 last:border-0 hover:bg-bg-subtle/50 transition-colors">
        <div className="pr-4">
            <p className="text-sm font-medium text-text-primary">{label}</p>
            {desc && <p className="text-xs text-text-tertiary mt-0.5 leading-relaxed">{desc}</p>}
        </div>
        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
            <div className={`w-11 h-6 bg-black/10 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-transparent after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary`}></div>
        </label>
    </div>
);

const ActionRow = ({ label, desc, icon, onClick, danger = false }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10 last:border-0 hover:bg-bg-subtle/50 transition-colors text-left"
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
