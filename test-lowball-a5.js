import pkg from 'pokersolver';
const { Hand } = pkg;

// 测试手牌
const hand1 = ['8s', 'qs', '3s', '8h', '8c']; // 8sqs3s8h8c - 三条
const hand2 = ['tc', '5c', 'jd', 'qd', '5d']; // tc5cjdqd5d - 两对

// 将卡片转换为 pokersolver 格式的函数
function toSolverCard(card) {
    if (!card) return '';
    let rank = card.slice(0, -1);
    const suit = card.slice(-1).toUpperCase();

    if (rank === 't') rank = 'T';
    if (rank === 'j') rank = 'J';
    if (rank === 'q') rank = 'Q';
    if (rank === 'k') rank = 'K';
    if (rank === 'a') rank = 'A';

    return rank + suit;
}

// 组合函数
function combinations(arr, n) {
    if (n === 0) return [[]];
    if (arr.length === n) return [arr];
    if (arr.length < n) return [];

    const [first, ...rest] = arr;
    const withFirst = combinations(rest, n - 1).map((comb) => [first, ...comb]);
    const withoutFirst = combinations(rest, n);

    return [...withFirst, ...withoutFirst];
}

// Lowball A-5 分数计算函数
function getLowballA5Score(cards) {
    const rankValues = {
        A: 1,
        '2': 2,
        '3': 3,
        '4': 4,
        '5': 5,
        '6': 6,
        '7': 7,
        '8': 8,
        '9': 9,
        T: 10,
        J: 11,
        Q: 12,
        K: 13,
    };

    const ranks = cards.map((c) => c[0]);
    const values = ranks.map((r) => rankValues[r]);

    const rankCounts = new Map();
    for (const v of values) {
        rankCounts.set(v, (rankCounts.get(v) || 0) + 1);
    }

    const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);
    let handType = 0; // 0=高牌, 1=一对, 2=两对, 3=三条, 4=葫芦, 5=四条

    if (counts[0] === 4)
        handType = 5; // 四条
    else if (counts[0] === 3 && counts[1] === 2)
        handType = 4; // 葫芦
    else if (counts[0] === 3)
        handType = 3; // 三条
    else if (counts[0] === 2 && counts[1] === 2)
        handType = 2; // 两对
    else if (counts[0] === 2) handType = 1; // 一对

    const highCards = values.sort((a, b) => b - a);
    let highCardValue = 0;
    highCards.forEach((card, index) => {
        highCardValue += card * Math.pow(16, index);
    });

    return { score: handType * 1000000 + highCardValue, highCards };
}

// 比较高牌函数
function compareHighCards(hand1, hand2) {
    for (let i = 0; i < hand1.length; i++) {
        if (hand1[i] < hand2[i]) return -1; // hand1 更好
        if (hand1[i] > hand2[i]) return 1; // hand2 更好
    }
    return 0; // 平局
}

// 读取手牌函数
function read5CardA5LowHands(playerHands) {
    const handTypeDescriptions = [
        'High Card',
        'One Pair',
        'Two Pair',
        'Three of a Kind',
        'Full House',
        'Four of a Kind'
    ];

    const solvedLowball = Object.entries(playerHands).map(([seat, cards]) => {
        const solverCards = cards.map(toSolverCard);
        const scoreResult = getLowballA5Score(solverCards);
        return {
            seat: Number(seat),
            lowballHand: {
                cards: solverCards,
                score: scoreResult.score,
                highCards: scoreResult.highCards
            },
        };
    });

    let bestLowball = solvedLowball[0];
    for (const player of solvedLowball) {
        console.log(`Player ${player.seat} score: ${player.lowballHand.score}`);
        console.log(`Player ${player.seat} hand type: ${Math.floor(player.lowballHand.score / 1000000)}`);
        console.log(`Player ${player.seat} high cards: ${player.lowballHand.highCards}`);
        if (
            player.lowballHand.score < bestLowball.lowballHand.score ||
            (player.lowballHand.score === bestLowball.lowballHand.score &&
                compareHighCards(player.lowballHand.highCards, bestLowball.lowballHand.highCards) < 0)
        ) {
            bestLowball = player;
            console.log(`New best player: ${player.seat}`);
        }
    }

    const winnerSeats = solvedLowball
        .filter(
            (p) =>
                p.lowballHand.score === bestLowball.lowballHand.score &&
                compareHighCards(p.lowballHand.highCards, bestLowball.lowballHand.highCards) === 0
        )
        .map((p) => p.seat)
        .sort((a, b) => a - b);

    const winnerHands = solvedLowball
        .filter((p) => winnerSeats.includes(p.seat))
        .map((p) => {
            const handType = Math.floor(p.lowballHand.score / 1000000);
            const handDescription = handTypeDescriptions[handType];
            return {
                cards: p.lowballHand.cards,
                score: p.lowballHand.score,
                highCards: p.lowballHand.highCards,
                descr: `${handDescription}: ${p.lowballHand.cards.join(' ')}`,
            };
        });

    const bestHandType = Math.floor(bestLowball.lowballHand.score / 1000000);
    const bestHandDescription = handTypeDescriptions[bestHandType];
    const bestHandDescr = `${bestHandDescription}: ${bestLowball.lowballHand.cards.join(' ')}`;

    return {
        seats: winnerSeats,
        hands: winnerHands,
        descr: bestHandDescr,
    };
}

// 测试
console.log('Testing Lowball A-5 hand comparison:');
console.log('-----------------------------------');

const result = read5CardA5LowHands({
    1: hand1, // 8sqs3s8h8c - 三条
    2: hand2  // tc5cjdqd5d - 两对
});

console.log('\n-----------------------------------');
console.log(`Winner seats: ${result.seats}`);
console.log(`Winner hands: ${result.hands.map(h => h.descr)}`);
console.log('-----------------------------------');
