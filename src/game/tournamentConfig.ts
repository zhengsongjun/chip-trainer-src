export type TournamentColor =
  | 'black100'
  | 'purple500'
  | 'yellow1k'
  | 'red5k'
  | 'green25k'

export const TOURNAMENT_CHIPS: Record<
  TournamentColor,
  {
    value: number
    smallGroup: number
  }
> = {
  black100: {
    value: 100,
    smallGroup: 5,
  },
  purple500: {
    value: 500,
    smallGroup: 4,
  },
  yellow1k: {
    value: 1000,
    smallGroup: 5,
  },
  red5k: {
    value: 5000,
    smallGroup: 5,
  },
  green25k: {
    value: 25000,
    smallGroup: 4,
  },
}
