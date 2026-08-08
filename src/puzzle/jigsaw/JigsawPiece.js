import { Piece } from '../Piece.js';

/**
 * JigsawPiece — Piece extension storing tab/slot edges and connected piece group graphs
 */
export class JigsawPiece extends Piece {
  constructor(config) {
    super(config);
    
    // Edges: { top, right, bottom, left }
    // 0 = Flat border, 1 = Tab (outward), -1 = Slot (inward)
    this.edges = config.edges || { top: 0, right: 0, bottom: 0, left: 0 };
    
    // Connected piece group graph
    this.groupId = null;
    this.groupMembers = new Set([this]);
  }

  /**
   * Merge another piece (or piece group) into this connected group
   * @param {JigsawPiece} otherPiece 
   */
  joinGroup(otherPiece) {
    if (!otherPiece || otherPiece === this) return;

    const targetGroup = this.groupId || `group_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const membersToMerge = Array.from(otherPiece.groupMembers);

    membersToMerge.forEach(piece => {
      piece.groupId = targetGroup;
      this.groupMembers.add(piece);
      piece.groupMembers = this.groupMembers;
    });
  }
}
