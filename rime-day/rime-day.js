// I have to annotate it as Array<string> because of
// https://github.com/JSMonk/hegel/issues/66
const months: Array<string> = [
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥"
];

const days: Array<string> = [
  "東",
  "冬",
  "江",
  "支",
  "微",
  "魚",
  "虞",
  "斉",
  "佳",
  "灰",
  "真",
  "文",
  "元",
  "寒",
  "刪",
  "銑",
  "篠",
  "巧",
  "皓",
  "哿",
  "馬",
  "養",
  "梗",
  "迥",
  "有",
  "宥",
  "沁",
  "勘",
  "艶",
  "卅",
  "世"
];

const encode = (date: $Immutable<Date>) => {
  const m = months[date.getMonth()];
  const d = days[date.getDate() - 1];
  if (m !== undefined && d !== undefined) {
    return m + d;
  } else {
    throw new TypeError(`failed to encode {date} as rime day`);
  }
};

const decode = (rimeDay: $Immutable<string>) => {
  const monthDay = rimeDay.split("");
  // hegel does not recognize destructuring assignment yet
  // https://github.com/JSMonk/hegel/issues/175
  const m = monthDay[0];
  const d = monthDay[1];
  if (m !== undefined && d !== undefined) {
    const month = months.indexOf(m);
    const day = days.indexOf(d);
    if (month != -1 && day !== -1) {
      return [month, day + 1];
    } else {
      throw new TypeError(`failed to decode {rimeDay}`);
    }
  } else {
    throw new TypeError(`failed to decode {rimeDay}`);
  }
};
