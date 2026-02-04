import pkg from 'pokersolver';
const { Hand } = pkg;

// BoardAnalysis 页面中的 toSolverCard 函数实现
function toSolverCard(card) {
    const suit = card.slice(-1);
    const rawRank = card.slice(0, -1);

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

    return rankMap[rawRank.toLowerCase()] + suit;
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

// Lowball A-5 分数计算函数 (修复后的版本)
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
function read5CardA5LowHands(playerHands, scoreFunction) {
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
        const scoreResult = scoreFunction(solverCards);
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

// 测试手牌
const hand1 = ['8s', 'qs', '3s', '8h', '8c']; // 8sqs3s8h8c - 三条
const hand2 = ['tc', '5c', 'jd', 'qd', '5d']; // tc5cjdqd5d - 两对

// 测试修复后的代码
console.log('=== 测试修复后的 Lowball A-5 牌力判断 ===');
console.log('------------------------------------------');

try {
    const result = read5CardA5LowHands({
        1: hand1,
        2: hand2
    }, getLowballA5Score);

    console.log(`获胜者座位: ${result.seats}`);
    console.log(`获胜者牌型: ${result.hands.map(h => h.descr)}`);

    if (result.seats.includes(2)) {
        console.log('✅ 正确！系统判定 tc5cjdqd5d 获胜');
    } else {
        console.log('❌ 错误！系统判定了错误的牌型获胜');
    }
} catch (error) {
    console.error('错误:', error);
}
