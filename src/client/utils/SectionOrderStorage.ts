const STORAGE_PREFIX = 'sectionOrder';

export enum SectionType {
  BOARD = 1,
  ACTIONS = 2,
  CARDS = 3,
  COLONIES = 4,
  LOG = 5
}

export class SectionOrderStorage {
  public static getSectionOrder(playerId: string): number[] {
    try {
      const order = typeof localStorage === 'undefined' ? null : localStorage.getItem(`${STORAGE_PREFIX}${playerId}`);
      if (order === null) {
        return [1, 2, 3, 4, 5]; // Default order: Board, Actions, Cards, Colonies, Log
      }
      const parsed = JSON.parse(order);
      // Always return 5 sections, ignoring any 6th section (chat) from old data
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 5).filter(x => x >= 1 && x <= 5);
      }
      return [1, 2, 3, 4, 5];
    } catch (err) {
      console.warn('unable to pull section order from local storage', err);
      return [1, 2, 3, 4, 5];
    }
  }

  public static updateSectionOrder(playerId: string, order: number[]): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${playerId}`, JSON.stringify(order));
    } catch (err) {
      console.warn('unable to update section order with local storage', err);
    }
  }

  public static getSectionName(sectionId: number): string {
    switch (sectionId) {
    case SectionType.BOARD: return 'board';
    case SectionType.ACTIONS: return 'actions';
    case SectionType.CARDS: return 'cards';
    case SectionType.COLONIES: return 'colonies';
    case SectionType.LOG: return 'log';
    default: return 'unknown';
    }
  }

  public static getSectionTitle(sectionId: number): string {
    switch (sectionId) {
    case SectionType.BOARD: return 'Jump to board';
    case SectionType.ACTIONS: return 'Jump to actions';
    case SectionType.CARDS: return 'Jump to cards';
    case SectionType.COLONIES: return 'Jump to colonies';
    case SectionType.LOG: return 'Jump to log';
    default: return 'Unknown section';
    }
  }
}
