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

// 检查玩家1所有可能的 2+3 组合
const player1Hole = ['7h', 'ts', '2d', 'jc', 'td'];
const board = ['qh', '7d', '4h', 'as', '8c'];

const holeCombos = combinations(player1Hole, 2);
const boardCombos = combinations(board, 3);

const allPossibleHands = [];
for (const hole of holeCombos) {
  for (const boardPart of boardCombos) {
    const hand = Hand.solve([...hole, ...boardPart].map(toSolverCard));
    allPossibleHands.push({
      combo: [...hole, ...boardPart],
      descr: hand.descr,
      hand: hand
    });
  }
}

// 按牌力排序
allPossibleHands.sort((a, b) => {
  const winners = Hand.winners([a.hand, b.hand]);
  if (winners[0] === a.hand) {
    return -1;
  } else {
    return 1;
  }
});

// 显示前10个最好的组合
console.log('Top 10 best hands for Player 1:');
for (let i = 0; i < Math.min(10, allPossibleHands.length); i++) {
  console.log(`${i+1}. ${allPossibleHands[i].descr} - [${allPossibleHands[i].combo.join(', ')}]`);
}