import Artplayer from 'artplayer';
import React, { useEffect, useRef } from 'react';
import './playerTheme.css';

/** 倍速档位（ArtPlayer 内置 settings 面板使用） */
const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

export interface VideoPlayerProps {
  /** 视频地址（完整 URL） */
  src: string;
  /** 封面 */
  poster?: string;
  /** 是否自动播放，默认 true */
  autoplay?: boolean;
  /** 起播位置（秒）。用于从卡片悬停预览的进度续播 */
  startAt?: number;
  /** 播完一个视频后触发（用于自动连播） */
  onEnded?: () => void;
  /** 播放进度变化回调（用于记忆进度） */
  onTimeUpdate?: (currentTime: number) => void;
  /** 播放器实例就绪回调（可用于外部控制） */
  onReady?: (art: Artplayer) => void;
  /**
   * 视频**真正开始播放**（首帧出画）时回调。
   *
   * 与 `onReady` 的区别：ready 只代表播放器实例与元数据就绪，
   * 此时画面还可能是黑屏 / 首帧未解码。若用它来关闭全屏 loading，
   * 用户会看到「遮罩消失但画面还是黑的」。所以关闭 loading
   * 应当用本回调。
   */
  onPlaying?: () => void;
  /** 加载出错（网络异常 / 格式不支持 / 地址失效）时回调 */
  onError?: (error: unknown) => void;
}

/**
 * ArtPlayer 封装（B 站风格）。
 *
 * 已开启的能力：
 * - 基础控件：播放/暂停、进度条（含拖拽预览）、音量、时间
 * - 倍速播放：0.5x ~ 2x（设置面板 + 快捷键）
 * - 全屏 / 网页全屏：右上角全屏按钮、双击视频切换网页全屏
 * - 画中画 PiP
 * - 键盘快捷键：空格播放暂停、←→ 快退/快进 5s、↑↓ 音量、M 静音、F 全屏
 * - 自动连播：播放结束后回调 onEnded，由上层切下一个视频
 *
 * 移动端默认使用原生控件（`playsInline`），避免自定义控件在窄屏上过密。
 */
/** 快捷键步长 */
const SEEK_STEP = 5; // 快进 / 快退秒数
const VOLUME_STEP = 0.1;

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  autoplay = true,
  startAt = 0,
  onEnded,
  onTimeUpdate,
  onReady,
  onPlaying,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<Artplayer | null>(null);
  // 用 ref 持有回调，避免回调变化导致播放器重建（会打断播放）
  const onEndedRef = useRef(onEnded);
  const onReadyRef = useRef(onReady);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onPlayingRef = useRef(onPlaying);
  const onErrorRef = useRef(onError);
  onEndedRef.current = onEnded;
  onReadyRef.current = onReady;
  onTimeUpdateRef.current = onTimeUpdate;
  onPlayingRef.current = onPlaying;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!containerRef.current) return;

    const art = new Artplayer({
      container: containerRef.current,
      url: src,
      poster,
      autoplay,
      // 由播放器自身按视频比例适配容器（不跟随容器拉伸）
      autoSize: false,
      playsInline: true,
      muted: false,
      volume: 1,
      setting: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      pip: true,
      miniProgressBar: true,
      // 双击播放器切换全屏（B 站习惯）；单击手势用于播放/暂停
      gesture: true,
      // 关闭内置 hotkey，改用下方自行绑定的 document 监听（行为更可控）
      hotkey: false,
      // 关闭 ArtPlayer 自带的进度记忆：进度由外部 playbackMemory 统一管理，
      // 两个来源并存会在续播时互相覆盖
      autoPlayback: false,
      moreVideoAttr: {
        // 不要设 crossOrigin：视频托管在独立 CDN，未返回 CORS 头，
        // 声明 anonymous 会导致浏览器直接拒绝加载（ERR_FAILED）。
        // 代价是无法用 canvas 截图 / 读取像素，但不影响播放。
        preload: 'metadata',
      },
      // 主题色跟随站点强调色（进度条 / 悬停 / 选中态）
      theme: '#007aff',
      cssVar: {
        '--art-border-radius': '8px',
        '--art-progress-height': '3px',
        '--art-control-height': '46px',
      },
      // 注意：不要在初始化时传 `controls` / `settings` 数组 ——
      // 那会**替换**内置控件（画面比例、设置、画中画、全屏等会全部消失）。
      // 需要在默认控件基础上追加时，用 ready 里的 art.controls.add()。
    });

    artRef.current = art;

    art.on('ready', () => {
      // 在默认控件之外**追加**一个倍速循环按钮（用 add 而非初始化传参，
      // 否则会替换掉内置控件）
      art.controls.add({
        name: 'playbackRateCycle',
        position: 'right',
        index: 10,
        html: '<span style="font-size:12px;padding:0 2px">倍速</span>',
        tooltip: '倍速播放',
        click() {
          const idx = PLAYBACK_RATES.findIndex(
            (r) => r === art.playbackRate,
          );
          art.playbackRate = PLAYBACK_RATES[(idx + 1) % PLAYBACK_RATES.length];
        },
      });
      // 从记录的进度续播（卡片悬停预览时的位置）。
      // 接近结尾时从头播，避免「一打开就播完」。
      if (startAt > 0) {
        const dur = art.duration;
        if (!Number.isFinite(dur) || startAt < dur - 3) {
          art.currentTime = startAt;
          art.play().catch(() => {
            /* 自动播放被拦截时保持暂停，由用户手动点击 */
          });
        }
      }
      onReadyRef.current?.(art);
    });
    // 播放结束：交由上层决定是否自动连播
    art.on('video:ended', () => onEndedRef.current?.());
    // 进度变化：上报给外部记录（用于下次续播）
    art.on('video:timeupdate', () => {
      onTimeUpdateRef.current?.(art.currentTime);
    });
    /**
     * 首帧出画：此时关闭全屏 loading 才不会看到黑屏。
     *
     * 用 `video:playing` 而非 `video:play` —— play 只是「已开始播放」，
     * 数据尚未解码；playing 才是真正有画面输出。
     */
    art.on('video:playing', () => onPlayingRef.current?.());
    // 加载失败（地址失效 / 网络异常 / 格式不支持）
    art.on('video:error', (error) => onErrorRef.current?.(error));

    /**
     * 键盘快捷键（自行绑定，不依赖 ArtPlayer 内置 hotkey）。
     *
     * 内置 hotkey 需要其内部 `isFocus` 为真 —— 该标记由 document 级 click 判定，
     * 在「弹层内嵌播放器 + 自定义控件」场景下不稳定（点画面只切换播放/暂停，
     * focus 未置位，导致空格、←→ 全部失效）。这里直接监听 document：
     * 空格播放暂停、←→ 快退/快进 5s、↑↓ 音量、M 静音、F 全屏。
     * 输入框 / 可编辑元素聚焦时不拦截，避免影响搜索框输入。
     */
    const onKeyDown = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const tag = (el?.tagName ?? '').toUpperCase();
      const editable = el?.getAttribute('contenteditable');
      if (tag === 'INPUT' || tag === 'TEXTAREA' || editable === 'true') return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          art.toggle();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          art.backward = SEEK_STEP;
          break;
        case 'ArrowRight':
          e.preventDefault();
          art.forward = SEEK_STEP;
          break;
        case 'ArrowUp':
          e.preventDefault();
          art.volume = Math.min(1, art.volume + VOLUME_STEP);
          break;
        case 'ArrowDown':
          e.preventDefault();
          art.volume = Math.max(0, art.volume - VOLUME_STEP);
          break;
        case 'KeyM':
          art.muted = !art.muted;
          break;
        case 'KeyF':
          art.fullscreen = !art.fullscreen;
          break;
        default:
          break;
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // 销毁前先暂停，避免声音继续
      art.pause();
      art.destroy(false);
      artRef.current = null;
    };
  }, [src, poster, autoplay]);

  return <div ref={containerRef} className="h-full w-full" />;
};

export default VideoPlayer;
