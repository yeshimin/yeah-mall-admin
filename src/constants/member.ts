export const MEMBER_GENDER = Object.freeze({
  UNKNOWN: 0,
  MALE: 1,
  FEMALE: 2,
})

export const MEMBER_ACTION = Object.freeze({
  INCREASE_POINTS: 'increase-points',
  DECREASE_POINTS: 'decrease-points',
  VIEW_POINTS_LEDGER: 'view-points-ledger',
})

export function getMemberGenderText(value?: number) {
  const text: Record<number, string> = {
    [MEMBER_GENDER.UNKNOWN]: '未知',
    [MEMBER_GENDER.MALE]: '男',
    [MEMBER_GENDER.FEMALE]: '女',
  }
  return text[Number(value ?? MEMBER_GENDER.UNKNOWN)] || '未知'
}
