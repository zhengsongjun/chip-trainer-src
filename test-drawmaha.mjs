import pkg from 'pokersolver';
const { Hand } = pkg;

function toSolverCard(card) {
  const rankMap = {
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

  const suitMap = {
    h: 'h',
    d: 'd',
    c: 'c',
    s: 's',
  };

  const rank = rankMap[card.slice(0, -1)];
  const suit = suitMap[card.slice(-1)];

  return rank + suit;
}

function combinations(arr, k) {
  if (k === 0) return [[]];
  if (arr.length < k) return [];

  const result = [];
  for (let i = 0; i <= arr.length - k; i++) {
    const head = arr[i];
    const tails = combinations(arr.slice(i + 1), k - 1);
    for (const tail of tails) {
      result.push([head, ...tail]);
    }
  }

  return result;
}

function getBestHand(holeCards, board) {
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

// 分别比较 Hand 类型和 Board 类型的牌力
console.log('\n=== Comparing Hand Type Players ===');
const handTypePlayers = [];
if (player1Best.type === 'hand' || player1Best.type === 'both') {
  handTypePlayers.push({ seat: 1, hand: player1Best });
}
if (player2Best.type === 'hand' || player2Best.type === 'both') {
  handTypePlayers.push({ seat: 2, hand: player2Best });
}

const handWinners = Hand.winners(handTypePlayers.map(p => p.hand));
const handWinnerSeats = handTypePlayers.filter(p => handWinners.includes(p.hand)).map(p => p.seat);
console.log('Winner(s):', handWinnerSeats.length, 'player(s)');
if (handWinnerSeats.length > 0) {
  const winningDescr = handWinners[0].descr;
  console.log('Winning Hand:', winningDescr);
  console.log('Winning Player(s):', handWinnerSeats.map(seat => `Player ${seat}`).join(', '));
}

console.log('\n=== Comparing Board Type Players ===');
const boardTypePlayers = [];
if (player1Best.type === 'board' || player1Best.type === 'both') {
  boardTypePlayers.push({ seat: 1, hand: player1Best });
}
if (player2Best.type === 'board' || player2Best.type === 'both') {
  boardTypePlayers.push({ seat: 2, hand: player2Best });
}

const boardWinners = Hand.winners(boardTypePlayers.map(p => p.hand));
const boardWinnerSeats = boardTypePlayers.filter(p => boardWinners.includes(p.hand)).map(p => p.seat);
console.log('Winner(s):', boardWinnerSeats.length, 'player(s)');
if (boardWinnerSeats.length > 0) {
  const winningDescr = boardWinners[0].descr;
  console.log('Winning Hand:', winningDescr);
  console.log('Winning Player(s):', boardWinnerSeats.map(seat => `Player ${seat}`).join(', '));
}