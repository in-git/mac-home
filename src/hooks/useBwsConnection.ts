import { useEffect } from 'react';
import { bwsClient, WsMessage,  } from '../api/websocket';

// 监听 SOCKET 推送，处理「用户上线」等业务事件
export function useBwsConnection() {
  useEffect(() => {
    const off = bwsClient.onMessage((msg: WsMessage) => {
      // 仅处理用户上线事件（参照 socket-test.html：module = USER, type = ONLINE）
      if (msg.module === 'USER' && msg.type === 'ONLINE') {
        const data = (msg.data ?? {}) as { userName: string; account: string; userId: string }
        const name = data.userName || data.account || data.userId || '一位用户';

        // 触发桌宠气泡提示（上线问候）
        window.dispatchEvent(
          new CustomEvent('pet-show-bubble', {
            detail: { text: `${name} 上线了，打个招呼吧~` },
          }),
        );
      }
    });

    bwsClient.connect();

    return () => {
      off();
      bwsClient.disconnect();
    };
  }, []);
}
