/**
 * 计算工时进度与距离下班的时间
 */
export function calculateWorkProgress(startTimeStr: string, endTimeStr: string, now: Date = new Date()) {
  const [startHour, startMin] = startTimeStr.split(':').map(Number);
  const [endHour, endMin] = endTimeStr.split(':').map(Number);

  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMin, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHour, endMin, 0);

  const currentMs = now.getTime();
  const startMs = start.getTime();
  const endMs = end.getTime();

  if (currentMs < startMs) {
    const diffSeconds = Math.floor((startMs - currentMs) / 1000);
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    return {
      status: 'before_work' as const,
      progressPercent: 0,
      countdownText: `距上班 ${hours}时${minutes}分`,
    };
  }

  if (currentMs >= endMs) {
    return {
      status: 'off_work' as const,
      progressPercent: 100,
      countdownText: '下班时间到！准时撤退 🎉',
    };
  }

  const totalDuration = endMs - startMs;
  const elapsed = currentMs - startMs;
  const progressPercent = Math.min(100, Math.max(0, Math.floor((elapsed / totalDuration) * 100)));

  const remainingSeconds = Math.floor((endMs - currentMs) / 1000);
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const countdownText = `距下班 ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return {
    status: 'working' as const,
    progressPercent,
    countdownText,
  };
}

/**
 * 计算距离发薪日的天数
 */
export function calculatePayday(payday: number, now: Date = new Date()) {
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let targetDate = new Date(currentYear, currentMonth, payday);

  if (currentDay === payday) {
    return {
      isToday: true,
      daysRemaining: 0,
      text: '今天发薪日！💰',
    };
  }

  if (currentDay > payday) {
    // 当月已过发薪日，计算次月
    targetDate = new Date(currentYear, currentMonth + 1, payday);
  }

  const oneDayMs = 24 * 60 * 60 * 1000;
  const todayZero = new Date(currentYear, currentMonth, currentDay).getTime();
  const targetZero = targetDate.getTime();
  const daysRemaining = Math.round((targetZero - todayZero) / oneDayMs);

  return {
    isToday: false,
    daysRemaining,
    text: `距发薪 ${daysRemaining} 天`,
  };
}
