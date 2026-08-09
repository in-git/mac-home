export const GREETINGS = [
  '你好呀！很高兴见到你~',
  '哈啰！今天天气真不错呢！',
  '嗨！有什么我可以帮你的吗？',
  '加油！又是充满活力的一天！',
  '建议多喝水，注意休息哦！',
  '按下方向键或 A/D 跟我一起散步吧！',
  '跳一个！按 W / Space 可以跳跃哦！',
  '呼~ 跑得有点快了呢！',
  '喵~ 祝你今天心情愉快！',
  '嗨！很高兴陪在你的桌面~',
];

export const getRandomGreeting = (): string => {
  const index = Math.floor(Math.random() * GREETINGS.length);
  return GREETINGS[index];
};

/**
 * 获取 1 到 5 秒之间的随机毫秒数
 */
export const getRandomInterval = (): number => {
  return Math.floor(Math.random() * 4000) + 1000;
};
