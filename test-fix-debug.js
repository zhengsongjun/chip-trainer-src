import pkg from 'pokersolver';
const { Hand } = pkg;

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
    console.log('Ranks:', ranks);
    const values = ranks.map((r) => rankValues[r]);
    console.log('Values:', values);

    const rankCounts = new Map();
    for (const v of values) {
        rankCounts.set(v, (rankCounts.get(v) || 0) + 1);
    }
    console.log('Rank counts:', Array.from(rankCounts.entries()));

    const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);
    console.log('Counts:', counts);
    let handType = 0;

    if (counts[0] === 4)
        handType = 5;
    else if (counts[0] === 3 && counts[1] === 2)
        handType = 4;
    else if (counts[0] === 3)
        handType = 3;
    else if (counts[0] === 2 && counts[1] === 2)
        handType = 2;
    else if (counts[0] === 2) handType = 1;

    let highCards;
    if (handType === 1) {
        const pairRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 2)[0];
        const otherRanks = Array.from(rankCounts.entries()).filter(([_, count]) => count === 1).map(([rank]) => rank).sort((a, b) => b - a);
        highCards = [pairRank, ...otherRanks];
    } else if (handType === 2) {
        const pairRanks = Array.from(rankCounts.entries()).filter(([_, count]) => count === 2).map(([rank]) => rank).sort((a, b) => b - a);
        const singleRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 1)[0];
        highCards = [...pairRanks, singleRank];
    } else if (handType === 3) {
        const threeRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 3)[0];
        const otherRanks = Array.from(rankCounts.entries()).filter(([_, count]) => count === 1).map(([rank]) => rank).sort((a, b) => b - a);
        highCards = [threeRank, ...otherRanks];
    } else if (handType === 4) {
        const threeRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 3)[0];
        const pairRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 2)[0];
        highCards = [threeRank, pairRank];
    } else if (handType === 5) {
        const fourRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 4)[0];
        const singleRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 1)[0];
        highCards = [fourRank, singleRank];
    } else {
        highCards = values.sort((a, b) => b - a);
    }

    console.log('High cards:', highCards);
    let highCardValue = 0;
    highCards.forEach((card, index) => {
        highCardValue += card * Math.pow(16, highCards.length - 1 - index);
    });

    return { score: handType * 1000000 + highCardValue, highCards };
}

function compareHighCards(hand1, hand2) {
    for (let i = 0; i < hand1.length; i++) {
        if (hand1[i] < hand2[i]) return -1;
        if (hand1[i] > hand2[i]) return 1;
    }
    return 0;
}

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
        console.log(`\nProcessing player ${seat}, cards: ${cards}`);
        const solverCards = cards.map(toSolverCard);
        console.log('Solver cards:', solverCards);
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
        console.log(`\nPlayer ${player.seat} score: ${player.lowballHand.score}`);
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

const hand1 = ['7d', '9s', '6c', '6s', '3d']; // 7d9s6c6s3d - 一对6
const hand2 = ['Th', 'Qh', 'As', '6h', 'Ac']; // ThQhAs6hAc - 一对A

console.log('=== 测试用户提到的第二个例子：一对6 vs 一对A ===');
try {
    const result = read5CardA5LowHands({
        1: hand1,
        2: hand2
    }, getLowballA5ScorePokerHandReader);

    console.log(`\nWinner seats: ${result.seats}`);
    console.log(`Winner hands: ${result.hands.map(h => h.descr)}`);

    if (result.seats.includes(2)) {
        console.log('\n✅ 测试通过！一对A获胜');
    } else {
        console.log('\n❌ 测试失败！应该是一对A获胜');
    }
} catch (error) {
    console.error('Error:', error);
}