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

// 检查玩家1的特定组合
const player1Combo = ['ts', 'td', 'as', 'qh', '8c'];
const hand = Hand.solve(player1Combo.map(toSolverCard));
console.log('Player 1 specific combo:', hand.descr);
console.log('Cards:', hand.cards);