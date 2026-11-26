export function getCompetitionRank(
    score: number | null,
    scores: Array<number | null>
): number | null {
    if (score === null) return null;

    return (
        1 +
        scores.filter(
            (value): value is number =>
                value !== null && value > score
        ).length
    );
}
