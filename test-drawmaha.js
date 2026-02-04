import { Hand } from 'pokersolver';

function toSolverCard(card: string): string {
  const rankMap: Record<string, string> = {
    a: 'A',
    k: 'K',
    q: 'Q',
    j: 'J',
    t: 'T',
    '10': 'T',
    '9': '9',
    '8': '8',
    '7': '7',
    '6': '6',
    '5': '5',
    '4': '4',
    '3': '3',
    '2': '2',
  };

  const suitMap: Record<string, string> = {
    h: 'h',
    d: 'd',
    c: 'c',
    s: 's',
  };

  const rank = rankMap[card.slice(0, -1)];
  const suit = suitMap[card.slice(-1)];

  return rank + suit;
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];

  const result: T[][] = [];
  for (let i = 0; i <= arr.length - k; i++) {
    const head = arr[i];
    const tails = combinations(arr.slice(i + 1), k - 1);
    for (const tail of tails) {
      result.push([head, ...tail]);
    }
  }

  return result;
}

function getBestHand(holeCards: string[], board: string[]) {
  // 1. 5张手牌成一手牌
  const handOnly = Hand.solve(holeCards.map(toSolverCard));

  // 2. 2张手牌 + 3张公共牌的最佳组合
  const holeCombos = combinations(holeCards, 2);
  const boardCombos = combinations(board, 3);

  const allPossibleHands = [];
  for (const hole of holeCombos) {
    for (const boardPart of boardCombos) {
      const hand = Hand.solve([...hole, ...boardPart].map(toSolverCard));
      allPossibleHands.push(hand);
    }
  }

  const bestBoardHand = Hand.winners(allPossibleHands)[0];

  // 比较两种情况的牌力
  const winners = Hand.winners([handOnly, bestBoardHand]);

  const result = Object.create(winners[0]);
  if (winners.length === 2) {
    result.type = 'both';
  } else {
    result.type = winners[0] === handOnly ? 'hand' : 'board';
  }

  return result;
}

// 测试用例
const player1Hole = ['7h', 'ts', '2d', 'jc', 'td'];
const player2Hole = ['9c', 'jd', '3h', '3d', '9h'];
const board = ['qh', '7d', '4h', 'as', '8c'];

console.log('=== Player 1 ===');
const player1Best = getBestHand(player1Hole, board);
console.log('Best Hand:', player1Best.descr);
console.log('Type:', player1Best.type);

console.log('\n=== Player 2 ===');
const player2Best = getBestHand(player2Hole, board);
console.log('Best Hand:', player2Best.descr);
console.log('Type:', player2Best.type);

console.log('\n=== Comparing both players ===');
const allPlayersHands = [
  Object.create(player1Best),
  Object.create(player2Best)
];
const overallWinners = Hand.winners(allPlayersHands);
console.log('Winners:', overallWinners.length, 'player(s)');
if (overallWinners.length > 0) {
  const winningDescr = overallWinners[0].descr;
  console.log('Winning Hand:', winningDescr);

  const winningPlayers = [];
  if (JSON.stringify(player1Best.cards) === JSON.stringify(overallWinners[0].cards)) {
    winningPlayers.push('Player 1');
  }
  if (JSON.stringify(player2Best.cards) === JSON.stringify(overallWinners[0].cards)) {
    winningPlayers.push('Player 2');
  }

  console.log('Winning Player(s):', winningPlayers.join(', '));
}