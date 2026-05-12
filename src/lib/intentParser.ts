import { addDays, nextDay, startOfDay } from 'date-fns';

export type IntentType = 'schedule' | 'mood' | 'unknown';

export interface ParsedIntent {
  type: IntentType;
  title?: string;
  description?: string;
  /** 格式: YYYY-MM-DDTHH:mm (本地时间字符串，无时区歧义) */
  scheduledAt?: string;
  moodScore?: number;
  /** 心情记录日期: YYYY-MM-DD */
  date?: string;
  events?: { text: string; period?: 'morning' | 'afternoon' | 'evening' }[];
  note?: string;
}

const MOOD_KEYWORDS = ['心情', '感觉', '日记', '情绪', '开心', '高兴', '难过', '伤心', '生气', '郁闷', '平静', '不错', '很好', '糟糕', '棒'];
const SCHEDULE_KEYWORDS = ['提醒', '日程', '会议', '约', '打卡', '见', '拜访', '要', '参加', '上课', '考试', '交', '截止'];

/** 具体时间点：X点、X分、X:X、X分钟后、X小时后 等 → 触发日程；X月X号只是日期，不算 */
function hasSpecificTime(text: string): boolean {
  return /(\d{1,2}|[一二两三四五六七八九十十一十二])点|(\d{1,2})分|\d{1,2}:\d{2}|(\d{1,2}|半)\s*个?[分钟小]?时?后/.test(text);
}

/** 宽泛时间段：昨天、今天、明天、上午、下午等 → 不触发日程 */
function hasBroadTime(text: string): boolean {
  return /昨天|今天|明天|后天|大后天|上午|下午|晚上|早上|中午|凌晨|一整天|全天/.test(text);
}

function detectIntent(text: string): IntentType {
  const lower = text.toLowerCase();
  const hasMood = MOOD_KEYWORDS.some((k) => lower.includes(k));
  const hasScheduleKw = SCHEDULE_KEYWORDS.some((k) => lower.includes(k));
  const hasSpecific = hasSpecificTime(text);
  const hasBroad = hasBroadTime(text);

  // 有具体时间点 → 一定是 schedule
  if (hasSpecific) return 'schedule';
  // 没有时间但有日程关键词 → schedule
  if (hasScheduleKw) return 'schedule';
  // 只有宽泛时间 → 默认识为 mood（记录今天做的事）
  if (hasBroad) return 'mood';
  // 只有心情关键词 → mood
  if (hasMood) return 'mood';
  return 'unknown';
}

/** 将 Date 格式化为 YYYY-MM-DDTHH:mm */
function toLocalDatetimeString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseDate(text: string): Date | undefined {
  const now = new Date();
  let date = startOfDay(now);
  let found = false;

  if (text.includes('大前天')) {
    date = addDays(startOfDay(now), -3);
    found = true;
  } else if (text.includes('前天')) {
    date = addDays(startOfDay(now), -2);
    found = true;
  } else if (text.includes('昨天')) {
    date = addDays(startOfDay(now), -1);
    found = true;
  } else if (text.includes('今天')) {
    date = startOfDay(now);
    found = true;
  } else if (text.includes('明天')) {
    date = addDays(startOfDay(now), 1);
    found = true;
  } else if (text.includes('后天')) {
    date = addDays(startOfDay(now), 2);
    found = true;
  } else if (text.includes('大后天')) {
    date = addDays(startOfDay(now), 3);
    found = true;
  }

  const weekDays: Record<string, number> = {
    '周日': 0, '星期天': 0,
    '周一': 1, '星期一': 1,
    '周二': 2, '星期二': 2,
    '周三': 3, '星期三': 3,
    '周四': 4, '星期四': 4,
    '周五': 5, '星期五': 5,
    '周六': 6, '星期六': 6,
  };

  for (const [name, dayIndex] of Object.entries(weekDays)) {
    if (text.includes(name)) {
      let target = nextDay(now, dayIndex as any);
      if (text.includes('下周') && target <= now) {
        target = addDays(target, 7);
      } else if (target <= now) {
        target = addDays(target, 7);
      }
      date = startOfDay(target);
      found = true;
      break;
    }
  }

  const monthDayMatch = text.match(/(\d{1,2})月(\d{1,2})[日号]/);
  if (monthDayMatch) {
    const month = parseInt(monthDayMatch[1]) - 1;
    const day = parseInt(monthDayMatch[2]);
    date = new Date(now.getFullYear(), month, day);
    found = true;
  }

  const dayOnlyMatch = text.match(/(\d{1,2})号/);
  if (dayOnlyMatch && !monthDayMatch) {
    const day = parseInt(dayOnlyMatch[1]);
    date = new Date(now.getFullYear(), now.getMonth(), day);
    found = true;
  }

  const daysLaterMatch = text.match(/(\d{1,2})天后/);
  if (daysLaterMatch) {
    date = addDays(startOfDay(now), parseInt(daysLaterMatch[1]));
    found = true;
  }

  return found ? date : undefined;
}

const CN_NUMBERS: Record<string, number> = {
  '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
  '十一': 11, '十二': 12,
};

function parseTime(text: string, baseDate: Date): string {
  const now = new Date();

  // 相对时间：X分钟后
  const minutesLaterMatch = text.match(/(\d{1,2})\s*分钟后?/);
  if (minutesLaterMatch) {
    const result = new Date(now.getTime() + parseInt(minutesLaterMatch[1]) * 60000);
    return toLocalDatetimeString(result);
  }

  // 相对时间：半小时后
  if (/半小时后/.test(text)) {
    const result = new Date(now.getTime() + 30 * 60000);
    return toLocalDatetimeString(result);
  }

  // 相对时间：X小时后
  const hoursLaterMatch = text.match(/(\d{1,2})\s*小时后?/);
  if (hoursLaterMatch) {
    const result = new Date(now.getTime() + parseInt(hoursLaterMatch[1]) * 3600000);
    return toLocalDatetimeString(result);
  }

  let hour: number | null = null;
  let minute = 0;

  // 阿拉伯数字时间
  const patterns = [
    { regex: /(\d{1,2}):(\d{2})/, h: 1, m: 2 },
    { regex: /(\d{1,2})点(\d{1,2})分/, h: 1, m: 2 },
    { regex: /(\d{1,2})点(\d{1,2})/, h: 1, m: 2 },
    { regex: /(\d{1,2})点/, h: 1, m: null },
  ];

  for (const p of patterns) {
    const match = text.match(p.regex);
    if (match) {
      hour = parseInt(match[p.h]);
      if (p.m && match[p.m]) minute = parseInt(match[p.m]);
      break;
    }
  }

  // 中文数字时间（三点、十一点半、两点半等）
  if (hour === null) {
    const cnMatch = text.match(/([一二两三四五六七八九十]|十一|十二)点(?:半|(\d{1,2})分)?/);
    if (cnMatch) {
      hour = CN_NUMBERS[cnMatch[1]];
      if (cnMatch[2]) minute = parseInt(cnMatch[2]);
      else if (text.includes('点半')) minute = 30;
    }
  }

  if (hour !== null) {
    // 下午/晚上 自动加 12
    if ((text.includes('下午') || text.includes('晚上')) && hour < 12) {
      hour += 12;
    }
    // 凌晨/早上 保持原样
    if (text.includes('凌晨') && hour >= 12) {
      hour -= 12;
    }
    // 晚上X点（如 晚上8点 → 20点）
    if (text.includes('晚上') && hour >= 1 && hour <= 6) {
      hour += 12;
    }
  }

  // 构造新的 Date，使用本地时间组件
  const result = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hour ?? 9,
    minute
  );

  return toLocalDatetimeString(result);
}

function parseMoodScore(text: string): number | undefined {
  const scoreMap: Record<string, number> = {
    '超棒': 5, '非常好': 5, '很棒': 5, '开心': 5, '超开心': 5,
    '不错': 4, '挺好': 4, '还好': 4, '好': 4, '可以': 4,
    '一般': 3, '还行': 3, '普通': 3, '凑合': 3, '平平淡淡': 3,
    '不太好': 2, '有点糟': 2, '郁闷': 2, '难过': 2, '烦': 2,
    '很糟': 1, '糟糕': 1, '太差': 1, '崩溃': 1, '绝望': 1,
  };

  for (const [phrase, score] of Object.entries(scoreMap)) {
    if (text.includes(phrase)) return score;
  }

  if (text.includes('开心') || text.includes('高兴') || text.includes('快乐')) return 4;
  if (text.includes('难过') || text.includes('伤心') || text.includes('哭')) return 2;
  if (text.includes('生气') || text.includes('愤怒') || text.includes('火大')) return 1;
  if (text.includes('平静') || text.includes('淡定')) return 3;

  return undefined;
}

function extractTitle(text: string): string {
  let title = text
    .replace(/明天|后天|大后天|今天|下周[一二三四五六日]|星期[一二三四五六日]|\d{1,2}月\d{1,2}[日号]|\d{1,2}号|\d{1,2}天后/g, '')
    .replace(/上午|下午|晚上|早上|中午|凌晨|([一二两三四五六七八九十]|十一|十二)点(?:半|\d{1,2}分)?|\d{1,2}点\d{1,2}分|\d{1,2}点|\d{1,2}:\d{2}/g, '')
    .replace(/\d{1,2}\s*分钟后?|半小时后|\d{1,2}\s*小时后?/g, '')
    .replace(/提醒我|记得|要去|参加|约|和/g, '')
    .trim();

  if (title.length > 20) title = title.slice(0, 20);
  if (!title) title = '新日程';
  return title;
}

function extractPeriod(text: string): 'morning' | 'afternoon' | 'evening' | undefined {
  if (text.includes('上午') || text.includes('早上')) return 'morning';
  if (text.includes('下午')) return 'afternoon';
  if (text.includes('晚上') || text.includes('傍晚')) return 'evening';
  return undefined;
}

function extractEventText(text: string): string {
  return text
    .replace(/今天|明天|后天|大后天|上午|下午|晚上|早上|中午|凌晨|一整天|全天/g, '')
    .replace(/心情|感觉|日记|情绪/g, '')
    .trim();
}

export function parseIntent(text: string): ParsedIntent {
  const type = detectIntent(text);

  if (type === 'schedule') {
    const date = parseDate(text);
    // 即使 parseDate 没识别到日期（如"15分钟后"），也要尝试 parseTime
    const scheduledAt = parseTime(text, date || new Date());
    const title = extractTitle(text);

    return {
      type: 'schedule',
      title,
      scheduledAt,
    };
  }

  if (type === 'mood') {
    const eventDate = parseDate(text);
    const period = extractPeriod(text);
    const eventText = extractEventText(text);
    const dateStr = eventDate
      ? `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`
      : undefined;

    return {
      type: 'mood',
      date: dateStr,
      events: eventText ? [{ text: eventText, period }] : undefined,
    };
  }

  const date = parseDate(text);
  return {
    type: 'schedule',
    title: text.trim().slice(0, 20),
    scheduledAt: date ? parseTime(text, date) : undefined,
  };
}

export function formatIntentPreview(intent: ParsedIntent): string {
  if (intent.type === 'schedule' && intent.scheduledAt) {
    const [d, t] = intent.scheduledAt.split('T');
    const [month, day] = d.split('-').slice(1);
    const [hour, minute] = t.split(':');
    return `创建日程：${intent.title}，时间：${parseInt(month)}月${parseInt(day)}日 ${hour}:${minute}`;
  }
  if (intent.type === 'schedule') {
    return `创建日程：${intent.title}`;
  }
  if (intent.type === 'mood') {
    const periodLabel: Record<string, string> = {
      morning: '上午',
      afternoon: '下午',
      evening: '晚上',
    };
    const event = intent.events?.[0];
    let preview = '记录事件';
    if (event) {
      preview += `：${periodLabel[event.period || ''] || ''}${event.text}`;
    }
    if (intent.date) {
      const d = new Date(intent.date + 'T00:00:00');
      preview += `（${d.getMonth() + 1}月${d.getDate()}日）`;
    }
    return preview;
  }
  return '';
}
