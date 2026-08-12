import { Solar } from 'lunar-typescript';

/**
 * 农历（阴历）转换工具。
 *
 * 基于 lunar-typescript 库，由公历日期换算农历年月日，
 * 并附带干支、生肖与农历月日的中文文案。
 */

const MONTH_NAMES = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '腊月',
];

export interface LunarDate {
  /** 农历年份（如 2026） */
  year: number;
  /** 农历月份（1-12） */
  month: number;
  /** 农历日（1-30） */
  day: number;
  /** 是否闰月 */
  isLeap: boolean;
  /** 干支年，如「丙午」 */
  ganzhiYear: string;
  /** 生肖，如「马」 */
  zodiac: string;
  /** 农历月文案（含闰前缀），如「闰六月」 */
  monthName: string;
  /** 农历日文案，如「廿三」 */
  dayName: string;
}

/** 将公历日期转换为农历信息。 */
export function getLunarDate(date: Date): LunarDate {
  const lunar = Solar.fromDate(date).getLunar();

  // 闰月时库返回负数月份（如闰二月为 -2）。
  const rawMonth = lunar.getMonth();
  const isLeap = rawMonth < 0;
  const month = Math.abs(rawMonth);

  return {
    year: lunar.getYear(),
    month,
    day: lunar.getDay(),
    isLeap,
    ganzhiYear: lunar.getYearInGanZhi(),
    zodiac: lunar.getYearShengXiao(),
    monthName: `${isLeap ? '闰' : ''}${MONTH_NAMES[month - 1]}`,
    dayName: lunar.getDayInChinese(),
  };
}

/** 便捷方法：返回如「农历丙午年 闰六月廿三」的完整文案。 */
export function getLunarDateText(date: Date): string {
  const lunar = getLunarDate(date);
  return `农历${lunar.ganzhiYear}${lunar.zodiac}年 ${lunar.monthName}${lunar.dayName}`;
}
