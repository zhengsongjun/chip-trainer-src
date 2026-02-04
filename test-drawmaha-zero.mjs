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

function calculateDrawmahaZeroScore(cards) {
  const rankValues = {
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'j': 0,
    'q': 0,
    'k': 0,
    'a': 1
  };

  let totalScore = 0;
  for (const card of cards) {
    const rank = card.slice(0, -1).toLowerCase();
    totalScore += rankValues[rank] || 0;
  }

  return Math.abs(totalScore - 0);
}

function getBestHand(holeCards, board, gameMode) {
  if (gameMode === 'drawmaha-zero') {
    const handScore = calculateDrawmahaZeroScore(holeCards);

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

    const result = Object.create(bestBoardHand);
    result.type = 'both';
    result.handScore = handScore;
    result.bestBoardHand = bestBoardHand;

    return result;
  }
}

// 测试案例
const testCase1 = {
  player1: ['Ks', '5c', '8d', '6c', '4d'],
  player2: ['As', 'Ac', '3d', 'tc', '7d'],
  board: ['2c', 'qc', '7h', 'ah', '2h']
};

console.log("=== Drawmaha Zero 模式测试 ===");
console.log();

console.log("=== 玩家手牌 ===");
console.log("玩家 1:", testCase1.player1);
console.log("玩家 2:", testCase1.player2);
console.log("公共牌:", testCase1.board);
console.log();

// 计算 Hand 分数（接近 0 点）
const player1HandScore = calculateDrawmahaZeroScore(testCase1.player1);
const player2HandScore = calculateDrawmahaZeroScore(testCase1.player2);

console.log("=== Hand 分数 ===");
console.log(`玩家 1: 分数 = ${player1HandScore} (距离 0)`);
console.log(`玩家 2: 分数 = ${player2HandScore} (距离 0)`);
console.log(`Hand 赢家: ${player1HandScore < player2HandScore ? '玩家 1' : '玩家 2'}`);
console.log();

// 计算 Board 牌力（Omaha High）
const player1Best = getBestHand(testCase1.player1, testCase1.board, 'drawmaha-zero');
const player2Best = getBestHand(testCase1.player2, testCase1.board, 'drawmaha-zero');

console.log("=== Board 牌力 ===");
console.log(`玩家 1: ${player1Best.bestBoardHand.descr}`);
console.log(`玩家 2: ${player2Best.bestBoardHand.descr}`);
console.log(`Board 赢家: ${Hand.winners([player1Best.bestBoardHand, player2Best.bestBoardHand])[0].descr}`);