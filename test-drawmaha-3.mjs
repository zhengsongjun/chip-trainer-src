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

  // 返回 both 类型，包含 Hand 和 Board 两种牌力
  const result = Object.create(handOnly);
  result.type = 'both';
  result.handOnly = handOnly;
  result.bestBoardHand = bestBoardHand;

  return result;
}

// 测试用户提到的新用例
const player1Hole = ['2d', '2c', '9d', '5s', '4s'];
const player2Hole = ['8s', 'th', '5d', '3d', 'kh'];
const board = ['qh', 'kd', '5c', '6s', '5h'];

console.log('=== Player 1 ===');
const player1Best = getBestHand(player1Hole, board);
console.log('Hand Only:', player1Best.handOnly.descr);
console.log('Best Board:', player1Best.bestBoardHand.descr);

console.log('\n=== Player 2 ===');
const player2Best = getBestHand(player2Hole, board);
console.log('Hand Only:', player2Best.handOnly.descr);
console.log('Best Board:', player2Best.bestBoardHand.descr);

// 分别比较 Hand 类型和 Board 类型的牌力
console.log('\n=== Comparing Hand Type Players ===');
const handWinners = Hand.winners([player1Best.handOnly, player2Best.handOnly]);
console.log('Hand Winner:', handWinners[0].descr);

console.log('\n=== Comparing Board Type Players ===');
const boardWinners = Hand.winners([player1Best.bestBoardHand, player2Best.bestBoardHand]);
console.log('Board Winner:', boardWinners[0].descr);