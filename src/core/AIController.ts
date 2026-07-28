import { DominoTile } from './DominoTile';
import { EndPoint } from './BoardLayout';

export class AIController {
    public getMove(leftEnd: EndPoint | null, rightEnd: EndPoint | null, hand: DominoTile[]): { tile: DominoTile, side: 'left' | 'right' } | null {
        for (let i = 0; i < hand.length; i++) {
            const tile = hand[i];
            if (rightEnd && tile.hasValue(rightEnd.val)) {
                return { tile, side: 'right' };
            }
            if (leftEnd && tile.hasValue(leftEnd.val)) {
                return { tile, side: 'left' };
            }
        }
        return null;
    }
}