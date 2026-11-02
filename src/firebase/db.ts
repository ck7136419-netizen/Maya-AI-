import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, FirebaseUser } from './config';
import { MemoryItem, ReminderTask, UserSettings } from '../types/yasmin';

export interface CloudUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  preferredNickname?: string;
  role: 'user' | 'admin' | 'owner';
  createdAt: string;
  updatedAt: string;
}

export interface CloudConversation {
  id: string;
  userId: string;
  title: string;
  summary?: string;
  lastMessage?: string;
  messageCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CloudMessage {
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  createdAt: string;
}

export interface CloudRemoteConfigItem {
  key: string;
  value: string;
  category?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface CloudFeatureFlag {
  featureKey: string;
  enabled: boolean;
  description?: string;
  minAppVersion?: string;
  updatedAt?: string;
}

export interface CloudAppVersion {
  versionCode: number;
  versionName: string;
  releaseNotes: string;
  downloadUrl: string;
  checksumSha256?: string;
  isMandatory: boolean;
  releaseDate: string;
}

const OWNER_EMAIL = 'chunnakumar3675@gmail.com';

/* ============================================================================
   1. USER PROFILE SYNC
   ============================================================================ */

export async function syncUserProfile(user: FirebaseUser, preferredNickname: string = 'Boss'): Promise<CloudUser> {
  const path = `users/${user.uid}`;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const existingSnap = await getDoc(userDocRef);
    const isOwner = user.email === OWNER_EMAIL;

    const cloudUser: CloudUser = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || preferredNickname,
      photoURL: user.photoURL || '',
      preferredNickname: existingSnap.exists()
        ? existingSnap.data()?.preferredNickname || preferredNickname
        : preferredNickname,
      role: isOwner ? 'owner' : (existingSnap.data()?.role || 'user'),
      createdAt: existingSnap.exists() ? existingSnap.data()?.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userDocRef, cloudUser, { merge: true });
    return cloudUser;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/* ============================================================================
   2. USER PREFERENCES
   ============================================================================ */

export async function saveUserPreferencesToCloud(userId: string, prefs: Partial<UserSettings>): Promise<void> {
  const path = `user_preferences/${userId}`;
  try {
    const prefRef = doc(db, 'user_preferences', userId);
    const data = {
      userId,
      nickname: prefs.nickname || 'Boss',
      personality: prefs.personality || 'caring',
      language: prefs.language || 'hinglish',
      geminiModel: prefs.geminiModel || 'gemini-3.8-flash',
      temperature: prefs.temperature ?? 0.7,
      ttsVoiceName: prefs.ttsVoiceName || '',
      ttsPitch: prefs.ttsPitch ?? 1.1,
      ttsRate: prefs.ttsRate ?? 1.0,
      soundEffects: prefs.soundEffects ?? true,
      theme: prefs.theme || 'cyan',
      memoryEnabled: prefs.memoryEnabled ?? true,
      wakeWordEnabled: prefs.wakeWordEnabled ?? true,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(prefRef, data, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function loadUserPreferencesFromCloud(userId: string): Promise<Partial<UserSettings> | null> {
  const path = `user_preferences/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'user_preferences', userId));
    if (snap.exists()) {
      return snap.data() as Partial<UserSettings>;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

/* ============================================================================
   3. PERMANENT LONG-TERM MEMORIES
   ============================================================================ */

export async function addCloudMemory(
  userId: string,
  content: string,
  category: 'preference' | 'personal' | 'work' | 'habit' | 'instruction' = 'personal',
  importance: number = 3
): Promise<MemoryItem> {
  const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `memories/${memoryId}`;
  try {
    const memoryDoc = {
      id: memoryId,
      userId,
      content: content.trim(),
      category,
      importance,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'memories', memoryId), memoryDoc);
    return {
      id: memoryId,
      content: memoryDoc.content,
      category,
      createdAt: Date.now(),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function loadCloudMemories(userId: string): Promise<MemoryItem[]> {
  const path = 'memories';
  try {
    const q = query(collection(db, 'memories'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const list: MemoryItem[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        id: data.id || d.id,
        content: data.content,
        category: data.category || 'personal',
        createdAt: new Date(data.createdAt || Date.now()).getTime(),
      });
    });
    return list.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function updateCloudMemory(
  memoryId: string,
  content: string,
  category?: 'preference' | 'personal' | 'work' | 'habit' | 'instruction'
): Promise<void> {
  const path = `memories/${memoryId}`;
  try {
    const updateData: Record<string, unknown> = {
      content: content.trim(),
      updatedAt: new Date().toISOString(),
    };
    if (category) updateData.category = category;
    await updateDoc(doc(db, 'memories', memoryId), updateData);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteCloudMemory(memoryId: string): Promise<void> {
  const path = `memories/${memoryId}`;
  try {
    await deleteDoc(doc(db, 'memories', memoryId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/* ============================================================================
   4. CONVERSATIONS & MESSAGES
   ============================================================================ */

export async function createCloudConversation(
  userId: string,
  title: string
): Promise<CloudConversation> {
  const convId = `conv_${Date.now()}`;
  const path = `conversations/${convId}`;
  try {
    const newConv: CloudConversation = {
      id: convId,
      userId,
      title: title.slice(0, 100),
      messageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'conversations', convId), newConv);
    return newConv;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function loadCloudConversations(userId: string): Promise<CloudConversation[]> {
  const path = 'conversations';
  try {
    const q = query(collection(db, 'conversations'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const list: CloudConversation[] = [];
    snap.forEach((d) => list.push(d.data() as CloudConversation));
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function saveCloudMessage(
  userId: string,
  conversationId: string,
  role: 'user' | 'assistant',
  text: string
): Promise<CloudMessage> {
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const path = `conversations/${conversationId}/messages/${msgId}`;
  try {
    const msg: CloudMessage = {
      id: msgId,
      conversationId,
      userId,
      role,
      text: text.slice(0, 8000),
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'conversations', conversationId, 'messages', msgId), msg);

    // Update parent conversation summary & last message
    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: text.slice(0, 200),
      updatedAt: new Date().toISOString(),
    });

    return msg;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function loadCloudMessages(
  userId: string,
  conversationId: string
): Promise<CloudMessage[]> {
  const path = `conversations/${conversationId}/messages`;
  try {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const list: CloudMessage[] = [];
    snap.forEach((d) => list.push(d.data() as CloudMessage));
    return list.sort((a, b) => a.timestamp - b.timestamp);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

/* ============================================================================
   5. SYNCHRONIZED TASKS
   ============================================================================ */

export async function saveCloudTask(userId: string, task: ReminderTask): Promise<void> {
  const path = `tasks/${task.id}`;
  try {
    const data = {
      id: task.id,
      userId,
      title: task.title,
      time: task.time,
      date: task.date,
      completed: task.completed,
      priority: task.priority,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'tasks', task.id), data, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function loadCloudTasks(userId: string): Promise<ReminderTask[]> {
  const path = 'tasks';
  try {
    const q = query(collection(db, 'tasks'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const list: ReminderTask[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        id: data.id || d.id,
        title: data.title,
        time: data.time || '12:00 PM',
        date: data.date || 'Today',
        completed: Boolean(data.completed),
        priority: data.priority || 'medium',
      });
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function deleteCloudTask(taskId: string): Promise<void> {
  const path = `tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/* ============================================================================
   6. REMOTE CONFIG & FEATURE FLAGS (Zero-APK Update System)
   ============================================================================ */

export async function loadRemoteConfigFromCloud(): Promise<Record<string, string>> {
  const path = 'remote_config';
  try {
    const snap = await getDocs(collection(db, 'remote_config'));
    const config: Record<string, string> = {};
    snap.forEach((d) => {
      const data = d.data();
      if (data.key && data.value) {
        config[data.key] = data.value;
      }
    });
    return config;
  } catch {
    return {};
  }
}

export async function saveRemoteConfigToCloud(
  key: string,
  value: string,
  category: string = 'general'
): Promise<void> {
  const path = `remote_config/${key}`;
  try {
    await setDoc(doc(db, 'remote_config', key), {
      key,
      value,
      category,
      updatedBy: auth.currentUser?.email || 'admin',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function loadFeatureFlagsFromCloud(): Promise<Record<string, boolean>> {
  const path = 'feature_flags';
  try {
    const snap = await getDocs(collection(db, 'feature_flags'));
    const flags: Record<string, boolean> = {};
    snap.forEach((d) => {
      const data = d.data();
      if (data.featureKey !== undefined) {
        flags[data.featureKey] = Boolean(data.enabled);
      }
    });
    return flags;
  } catch {
    return {};
  }
}

export async function saveFeatureFlagToCloud(
  featureKey: string,
  enabled: boolean,
  description?: string
): Promise<void> {
  const path = `feature_flags/${featureKey}`;
  try {
    await setDoc(doc(db, 'feature_flags', featureKey), {
      featureKey,
      enabled,
      description: description || '',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/* ============================================================================
   7. APP VERSIONS & PLAY TESTING UPDATES
   ============================================================================ */

export async function getLatestAppVersion(): Promise<CloudAppVersion | null> {
  const path = 'app_versions';
  try {
    const snap = await getDocs(collection(db, 'app_versions'));
    const list: CloudAppVersion[] = [];
    snap.forEach((d) => list.push(d.data() as CloudAppVersion));
    if (list.length === 0) return null;
    list.sort((a, b) => b.versionCode - a.versionCode);
    return list[0];
  } catch {
    return null;
  }
}

export async function publishAppVersion(version: CloudAppVersion): Promise<void> {
  const id = `v_${version.versionCode}`;
  const path = `app_versions/${id}`;
  try {
    await setDoc(doc(db, 'app_versions', id), version);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
