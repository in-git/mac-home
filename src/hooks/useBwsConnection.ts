import { useEffect } from 'react';
import { bwsClient, type WSMessage, type WsUserOnlineData } from '../api/websocket';
import { petSpeak } from '../agent/pet/actions';

/**
 * B 端 WebSocket 对接：进入界面即建立连接，监听用户上线事件并让桌宠气泡提示。
 * 文档见 md/B端WebSocket对接文档.md：端点 /bws，心跳 ping/pong，鉴权 token。
 *
 * 订阅与连接的生命周期与挂载它的组件一致：挂载时连接并订阅，卸载时取消订阅
 * 并断开连接，避免重复建连。
 */
export function useBwsConnection() {
  useEffect(() => {
    bwsClient.connect();

    const offMessage = bwsClient.onMessage((msg: WSMessage) => {
      if (msg.type !== 'USER_ONLINE') return;
      const data = (msg.data ?? {}) as WsUserOnlineData;
      const name = data.userName || data.account || data.userId || '一位用户';
      petSpeak(`${name} 上线了，打个招呼吧~`, { duration: 5000 });
    });

    const offStatus = bwsClient.onStatus((status) => {
      console.info(`[BWS] 连接状态：${status}`);
    });

    return () => {
      offMessage();
      offStatus();
      bwsClient.disconnect();
    };
  }, []);
}
