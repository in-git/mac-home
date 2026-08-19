import { useEffect, useState } from 'react';
import { Calendar, TrendingUp, Clock, Radio, Users } from 'lucide-react';
import { onlineCountClient } from '../../api/websocket';
import { visitorApi, type VisitorOverview } from '../../api/visitor';

interface MemberCountWidgetProps {
  editing?: boolean;
}

/** 统计小项：label 文案、icon 图标、value 取值函数 */
interface StatItem {
  label: string;
  icon: typeof Calendar;
  /** 从实时在线人数（WebSocket）与看板概览（HTTP）中取值 */
  getValue: (online: number | null, overview: VisitorOverview | null) => number | null;
}

const STAT_ITEMS: StatItem[] = [
  {
    label: '月访客',
    icon: Calendar,
    getValue: (_online, overview) => (overview ? overview.monthUv : null),
  },
  {
    label: '周访客',
    icon: TrendingUp,
    getValue: (_online, overview) => (overview ? overview.weekUv : null),
  },
  {
    label: '当日访客',
    icon: Clock,
    getValue: (_online, overview) => (overview ? overview.todayUv : null),
  },
];

/** 人数卡片：当前在线（实时，WebSocket）为主，辅以月/周/当日访客（HTTP 看板接口）。 */
export function MemberCountWidget(_props: MemberCountWidgetProps) {
  const [online, setOnline] = useState<number | null>(null);
  const [overview, setOverview] = useState<VisitorOverview | null>(null);
  const [connected, setConnected] = useState(false);

  // 1) 实时在线人数：原生 WebSocket /ws/ws-online（免登录，参照 socket-test.html）
  useEffect(() => {
    onlineCountClient.connect();

    const off = onlineCountClient.onCount((total) => {
      setOnline(total);
      setConnected(true);
    });

    return () => {
      off();
      onlineCountClient.disconnect();
    };
  }, []);

  // 2) 访客看板数据：HTTP 获取今日/本周/本月访客，并定时刷新
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await visitorApi.getDashboard();
        if (alive && res?.overview) setOverview(res.overview);
      } catch {
        /* 静默失败，保留上一次数据或占位符 */
      }
    };
    load();
    // 每 60s 刷新一次（文档建议 1~5 分钟，这里取较短间隔以便看板更鲜活）
    const timer = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex h-full w-full flex-col  p-0.5 select-none justify-between">
      {/* 顶栏标题与连接状态 */}
      <div className="flex items-center justify-between shrink-0 mb-1">
        <span className="text-font-sm    leading-tight">
          同频同仁
        </span>
        <span
          className={`flex items-center gap-1 text-[11px] leading-tight ${
            connected ? 'text-emerald-500' : 'text-amber-500'
          }`}
          title={connected ? '已连接' : '连接中…'}
        >
          <Radio size={12} className={connected ? '' : 'animate-pulse'} />
          {connected ? '实时' : '连接中'}
        </span>
      </div>

      {/* 主指标：当前在线（实时，WebSocket），自适应高度居中 */}
      <div className="flex flex-1 flex-col items-center justify-center rounded-[var(--card-radius)] px-2 py-1.5 text-center bg-[color:var(--accent)]/10 min-h-0 mb-1.5">
        <span className="text-6xl font-bold tabular-nums leading-tight text-[color:var(--accent)]">
          {online != null ? online.toLocaleString() : '—'}
        </span>
        <span className="leading-tight">
          当前在线
        </span>
      </div>

      {/* 访客统计：月 / 周 / 当日，一排三列 */}
      <div className="grid grid-cols-3 gap-1.5 shrink-0">
        {STAT_ITEMS.map(({ label, icon: Icon, getValue }) => {
          const value = getValue(online, overview);
          return (
            <div
              key={label}
              className="flex flex-col items-center justify-center rounded-[var(--card-radius)] bg-black/5 px-1.5 py-1 text-center dark:bg-white/10"
            >
              <Icon
                size={14}
                className="mb-0.5 text-[color:var(--accent)]"
              />
              <span className="text-base  tabular-nums leading-tight">
                {value != null ? value.toLocaleString() : '—'}
              </span>
              <span className="leading-tight text-sm">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MemberCountWidget;
