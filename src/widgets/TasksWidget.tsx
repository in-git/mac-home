import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Clock,
  AlertCircle,
  Bell,
  Trash2,
  Calendar,
  Filter,
  CheckCircle2,
  Volume2
} from 'lucide-react';
import { ReminderTask, TaskPriority } from '../types';
import { playSound } from '../utils/sound';

interface Props {
  tasks: ReminderTask[];
  onUpdateTasks: (tasks: ReminderTask[]) => void;
}

export const TasksWidget: React.FC<Props> = ({ tasks, onUpdateTasks }) => {
  const [activeTab, setActiveTab] = useState<'today' | 'scheduled' | 'work' | 'personal' | 'completed'>('today');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('18:00');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Check real-time timers every minute to trigger audio alert if task is due
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMins}`;

      tasks.forEach((task) => {
        if (!task.completed && task.dueTime === currentTimeStr && task.hasAlarm) {
          if (soundEnabled) {
            playSound.playAlert();
          }
        }
      });
    };

    const interval = setInterval(checkAlarms, 30000); // check every 30s
    return () => clearInterval(interval);
  }, [tasks, soundEnabled]);

  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'completed') return t.completed;
    if (activeTab === 'today') return !t.completed && t.category === 'today';
    if (activeTab === 'scheduled') return !t.completed && Boolean(t.dueDate);
    if (activeTab === 'work') return !t.completed && t.category === 'work';
    if (activeTab === 'personal') return !t.completed && t.category === 'personal';
    return !t.completed;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    playSound.playClick();
    const newTask: ReminderTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: newTaskTime,
      completed: false,
      priority: newTaskPriority,
      category: activeTab === 'completed' ? 'today' : activeTab,
      hasAlarm: true,
      alarmSound: true,
    };

    onUpdateTasks([newTask, ...tasks]);
    setNewTaskTitle('');
  };

  const handleToggleTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    if (!task.completed && soundEnabled) {
      playSound.playChime();
    } else {
      playSound.playClick();
    }

    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    onUpdateTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    playSound.playClick();
    onUpdateTasks(tasks.filter((t) => t.id !== id));
  };

  const priorityBadgeStyle: Record<TaskPriority, string> = {
    high: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
    medium: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    low: 'bg-[#007AFF]/15 text-[#007AFF] border-[#007AFF]/30',
  };

  return (
    <div className="h-full flex flex-col justify-between text-xs p-1 text-slate-800 dark:text-slate-100">
      {/* Header & Filter Tabs */}
      <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center space-x-2">
          <CheckCircle2 size={16} className="text-[#007AFF]" />
          <span className="font-bold text-sm tracking-tight">提醒事项 (Reminders)</span>
        </div>

        {/* Task Progress Ring / Stat */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-[11px] font-semibold text-slate-500">
            <span>完成度 {progressPct}%</span>
            <div className="w-12 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#007AFF] transition-all duration-500 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => {
              playSound.playClick();
              setSoundEnabled(!soundEnabled);
            }}
            className={`p-1 rounded-md transition-colors ${
              soundEnabled ? 'text-[#007AFF] bg-blue-50 dark:bg-blue-950/40' : 'text-slate-400'
            }`}
            title={soundEnabled ? '开启到期声音提醒' : '静音提醒'}
          >
            <Volume2 size={13} />
          </button>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex items-center space-x-1 my-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'today', label: '今日' },
          { id: 'scheduled', label: '已计划' },
          { id: 'work', label: '工作' },
          { id: 'personal', label: '个人' },
          { id: 'completed', label: '已完成' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              playSound.playClick();
              setActiveTab(tab.id as typeof activeTab);
            }}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all text-[11px] shrink-0 ${
              activeTab === tab.id
                ? 'bg-[#007AFF] text-white shadow-xs font-semibold'
                : 'bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-black/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleAddTask} className="flex items-center space-x-2 my-1">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="添加新提醒事项..."
          className="flex-1 px-3 py-1.5 rounded-[12px] bg-black/5 dark:bg-white/10 border-none outline-none focus:ring-2 focus:ring-[#007AFF]/50 text-xs"
        />
        <input
          type="time"
          value={newTaskTime}
          onChange={(e) => setNewTaskTime(e.target.value)}
          className="px-2 py-1.5 rounded-[12px] bg-black/5 dark:bg-white/10 text-xs outline-none"
        />
        <select
          value={newTaskPriority}
          onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
          className="px-2 py-1.5 rounded-[12px] bg-black/5 dark:bg-white/10 text-xs outline-none"
        >
          <option value="high">高优先级</option>
          <option value="medium">中优先级</option>
          <option value="low">低优先级</option>
        </select>
        <button
          type="submit"
          className="px-3 py-1.5 rounded-[12px] bg-[#007AFF] text-white font-medium hover:bg-blue-600 shadow-xs"
        >
          <Plus size={14} />
        </button>
      </form>

      {/* Tasks List Container */}
      <div className="flex-1 overflow-y-auto space-y-1.5 py-1 pr-1 max-h-56">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-between group border border-transparent ${
                task.completed
                  ? 'bg-black/3 dark:bg-white/3 opacity-60'
                  : 'bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 shadow-xs'
              }`}
            >
              <div
                className="flex items-center space-x-2.5 cursor-pointer flex-1"
                onClick={() => handleToggleTask(task.id)}
              >
                {task.completed ? (
                  <CheckSquare size={16} className="text-[#007AFF] shrink-0" />
                ) : (
                  <Square size={16} className="text-slate-400 group-hover:text-[#007AFF] shrink-0" />
                )}
                <div className="flex-1">
                  <div
                    className={`font-medium ${
                      task.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {task.title}
                  </div>
                  {task.notes && <div className="text-[10px] text-slate-400">{task.notes}</div>}
                </div>
              </div>

              {/* Badges & Time */}
              <div className="flex items-center space-x-2 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    priorityBadgeStyle[task.priority]
                  }`}
                >
                  {task.priority === 'high' && '高'}
                  {task.priority === 'medium' && '中'}
                  {task.priority === 'low' && '低'}
                </span>

                {task.dueTime && (
                  <span className="text-[10px] font-mono font-medium text-slate-500 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-md flex items-center space-x-1">
                    <Clock size={10} />
                    <span>{task.dueTime}</span>
                  </span>
                )}

                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs">暂无包含事项</div>
        )}
      </div>
    </div>
  );
};
