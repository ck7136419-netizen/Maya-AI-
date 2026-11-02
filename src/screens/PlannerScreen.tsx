import React, { useState } from 'react';
import { Calendar, Plus, CheckCircle2, Circle, Trash2, Bell, Clock, Sparkles } from 'lucide-react';
import { ReminderTask } from '../types/yasmin';
import { sounds } from '../utils/soundEffects';
import { speech } from '../utils/speechSynthesis';

interface PlannerScreenProps {
  tasks: ReminderTask[];
  onAddTask: (task: Omit<ReminderTask, 'id' | 'completed'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  nickname: string;
}

export const PlannerScreen: React.FC<PlannerScreenProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  nickname,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('10:00 AM');
  const [newDate, setNewDate] = useState('Today');
  const [priority, setPriority] = useState<ReminderTask['priority']>('medium');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    sounds.playClickSound();
    onAddTask({
      title: newTitle.trim(),
      time: newTime,
      date: newDate,
      priority,
    });
    setNewTitle('');
    setIsAdding(false);
  };

  const handleVoiceAlarmTest = (taskTitle: string) => {
    sounds.playAlertTone();
    setTimeout(() => {
      speech.speak(`Reminder for ${nickname}: It is time to ${taskTitle}. Don't forget!`);
    }, 400);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-3 space-y-5 select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900/80 border border-amber-500/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              Daily Planner & Reminder Protocols
            </div>
            <div className="text-[11px] text-neutral-400">
              Voice-notified schedules & smart JARVIS reminders
            </div>
          </div>
        </div>
      </div>

      {/* Add Task Form */}
      {isAdding ? (
        <form onSubmit={handleAdd} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="text-xs font-bold text-white">Create New Protocol or Reminder</div>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Call client at 4 PM, Take medicines, Gym workout"
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              placeholder="Time (e.g. 10:00 AM)"
              className="px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200"
            />
            <input
              type="text"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              placeholder="Date (e.g. Today)"
              className="px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as ReminderTask['priority'])}
              className="px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-amber-300"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs"
            >
              Set Reminder
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="w-full py-3 rounded-2xl border border-dashed border-neutral-800 hover:border-amber-500/40 text-neutral-400 hover:text-white text-xs flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Reminder / Schedule Item</span>
        </button>
      )}

      {/* Task List */}
      <div className="space-y-2.5">
        {tasks.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 text-xs font-mono border border-neutral-800/60 rounded-2xl">
            No active schedules. Tell YASMIN: &quot;Remind me to call Mom at 6 PM&quot;!
          </div>
        ) : (
          tasks.map((t) => (
            <div
              key={t.id}
              className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                t.completed
                  ? 'bg-neutral-950/40 border-neutral-900 opacity-60'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-amber-500/30'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClickSound();
                    onToggleTask(t.id);
                  }}
                  className="text-neutral-500 hover:text-amber-400 transition cursor-pointer shrink-0"
                >
                  {t.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div className="min-w-0">
                  <div
                    className={`text-xs font-semibold ${
                      t.completed ? 'line-through text-neutral-500' : 'text-neutral-100'
                    }`}
                  >
                    {t.title}
                  </div>
                  <div className="text-[10px] text-neutral-400 flex items-center gap-2 mt-0.5 font-mono">
                    <span className="flex items-center gap-1 text-cyan-400">
                      <Clock className="w-3 h-3" />
                      {t.time}
                    </span>
                    <span>•</span>
                    <span>{t.date}</span>
                    <span>•</span>
                    <span
                      className={`uppercase text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        t.priority === 'high'
                          ? 'bg-rose-500/20 text-rose-300'
                          : t.priority === 'medium'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleVoiceAlarmTest(t.title)}
                  title="Test voice alarm chime"
                  className="p-1.5 text-neutral-400 hover:text-amber-400 transition cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTask(t.id)}
                  title="Delete schedule"
                  className="p-1.5 text-neutral-500 hover:text-rose-400 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
