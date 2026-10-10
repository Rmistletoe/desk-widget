/**
 * 将阿拉伯数字金额转换为中文大写金额
 * 符合中国人民银行结算办法规定格式
 * @param money 数字金额或字符串，如 123456.78
 * @returns 中文大写金额，如 "壹拾贰万叁仟肆佰伍拾陆元柒角捌分"
 */
export function convertToRmbCapital(money: number | string): string {
  if (money === '' || money === null || money === undefined) return '';

  const num = typeof money === 'string' ? parseFloat(money.replace(/,/g, '')) : money;
  if (isNaN(num)) return '金额格式有误';
  if (num === 0) return '零元整';

  const fraction = ['角', '分'];
  const digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const unit = [
    ['元', '万', '亿'],
    ['', '拾', '佰', '仟'],
  ];

  const head = num < 0 ? '欠' : '';
  const absNum = Math.abs(num);

  let s = '';

  // 处理角分小数部分
  const decimalPart = Math.floor(absNum * 100) % 100;
  const jiao = Math.floor(decimalPart / 10);
  const fen = decimalPart % 10;

  if (jiao === 0 && fen === 0) {
    s = '整';
  } else {
    if (jiao !== 0) s += digit[jiao] + fraction[0];
    if (fen !== 0) s += digit[fen] + fraction[1];
  }

  // 处理整数部分
  let integerPart = Math.floor(absNum);
  let integerStr = '';

  for (let i = 0; i < unit[0].length && integerPart > 0; i++) {
    let p = '';
    for (let j = 0; j < unit[1].length && integerPart > 0; j++) {
      p = digit[integerPart % 10] + unit[1][j] + p;
      integerPart = Math.floor(integerPart / 10);
    }
    integerStr = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + integerStr;
  }

  const result = head + (integerStr.replace(/(零.)*零元/, '元')
    .replace(/(零.)+/g, '零')
    .replace(/^整$/, '零元整') || '零元') + s;

  return result.replace(/^元/, '零元');
}
