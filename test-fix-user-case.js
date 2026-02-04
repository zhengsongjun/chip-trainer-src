import pkg from 'pokersolver';
const { Hand } = pkg;

// BoardAnalysis 页面中的 toSolverCard 函数实现
function toSolverCard(card) {
    const suit = card.slice(-1);
    const rawRank = card.slice(0, -1).toLowerCase();

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

    return rankMap[rawRank] + suit;
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

// Lowball A-5 分数计算函数 (PokerHandReader.ts 中的版本 - 已修复)
function getLowballA5ScorePokerHandReader(cards) {
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

    // 根据不同牌型确定正确的高牌比较顺序
    let highCards;
    if (handType === 1) { // 一对
        // 先找到对子的点数，然后将其他牌从大到小排列
        const pairRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 2)[0];
        const otherRanks = Array.from(rankCounts.entries()).filter(([_, count]) => count === 1).map(([rank]) => rank).sort((a, b) => b - a);
        highCards = [pairRank, ...otherRanks];
    } else if (handType === 2) { // 两对
        // 先比较大的对子，然后小的对子，然后单张
        const pairRanks = Array.from(rankCounts.entries()).filter(([_, count]) => count === 2).map(([rank]) => rank).sort((a, b) => b - a);
        const singleRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 1)[0];
        highCards = [...pairRanks, singleRank];
    } else if (handType === 3) { // 三条
        // 先比较三条的点数，然后是单张
        const threeRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 3)[0];
        const otherRanks = Array.from(rankCounts.entries()).filter(([_, count]) => count === 1).map(([rank]) => rank).sort((a, b) => b - a);
        highCards = [threeRank, ...otherRanks];
    } else if (handType === 4) { // 葫芦
        // 先比较三条的点数，然后是对子的点数
        const threeRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 3)[0];
        const pairRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 2)[0];
        highCards = [threeRank, pairRank];
    } else if (handType === 5) { // 四条
        // 先比较四条的点数，然后是单张
        const fourRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 4)[0];
        const singleRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 1)[0];
        highCards = [fourRank, singleRank];
    } else { // 高牌
        // 从大到小排序
        highCards = values.sort((a, b) => b - a);
    }

    let highCardValue = 0;
    highCards.forEach((card, index) => {
        highCardValue += card * Math.pow(16, highCards.length - 1 - index);
    });

    return { score: handType * 1000000 + highCardValue, highCards };
}

// Lowball A-5 分数计算函数 (BoardAnalysis 页面中的版本)
function getLowballA5ScoreBoardAnalysis(cards) {
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
    return { score: handType * 1000000, highCards };
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

// 测试手牌 - 用户提到的例子
const hand1 = ['7d', '7c', '6h', '9d', '5d']; // 7d7c6h9d5d - 一对7
const hand2 = ['9s', 'Js', 'Jh', '2d', '3s']; // 9sjsjh2d3s - 一对J

console.log('=== 测试用户提到的例子：一对7 vs 一对J ===');
try {
    const result = read5CardA5LowHands({
        1: hand1, // 一对7
        2: hand2  // 一对J
    }, getLowballA5ScorePokerHandReader);

    console.log(`\nWinner seats: ${result.seats}`);
    console.log(`Winner hands: ${result.hands.map(h => h.descr)}`);

    if (result.seats.includes(1)) {
        console.log('\n✅ 测试通过！一对7获胜');
    } else {
        console.log('\n❌ 测试失败！应该是一对7获胜');
    }
} catch (error) {
    console.error('Error:', error);
}