// ===== Types for PolicySnap =====

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  totalXP: number;
  rankLevel: RankLevel;
  evaluationsCount: number;
  upvotesCount?: number;
  joinedAt: string;
  catAvatar?: CatProfile;
}

export interface EvaluationScores {
  effectiveness: number;
  efficiency: number;
  equity: number;
  responsiveness: number;
}

export type RankLevel =
  | 'warga-aktif'
  | 'netizen-kritis'
  | 'auditor-regulasi'
  | 'konsultan'
  | 'advokat-kebijakan'
  | 'menteri-bayangan'
  | 'negarawan';

export interface RankInfo {
  level: number;
  key: RankLevel;
  name: string;
  minXP: number;
  maxXP: number;
  color: string;
  badgeClass: string;
  icon: string;
}

// ===== 2D Cat Avatar & Costume Gamification Types =====
export type CatBreed = 'domestik' | 'persia' | 'siam';
export type CatGender = 'male' | 'female';
export type CatCostumeSlot = 'head' | 'eyes' | 'body' | 'accessory';

export interface CatCostumeItem {
  id: string;
  name: string;
  slot: CatCostumeSlot;
  requiredLevel: number;
  achievementKey?: string;
  description: string;
  icon: string;
  previewColor: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface CatEquipped {
  head?: string | null;
  eyes?: string | null;
  body?: string | null;
  accessory?: string | null;
}

export interface CatProfile {
  name: string;
  gender: CatGender;
  breed: CatBreed;
  furColor: string;
  bellyColor: string;
  eyeColor: string;
  earColor: string;
  equipped: CatEquipped;
}

export interface CriteriaDescriptions {
  effectiveness?: string;
  efficiency?: string;
  equity?: string;
  responsiveness?: string;
}

export interface PolicyIssue {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
  actorTags: string[];
  status: 'active' | 'closed';
  createdAt: string;
  totalEvaluations: number;
  imageUrl?: string;
  category?: string;
  criteriaDescriptions?: CriteriaDescriptions;
  actorCards?: ActorCard[];
}

export interface Evaluation {
  userId: string;
  issueId: string;
  effectiveness: number;
  efficiency: number;
  equity: number;
  responsiveness: number;
  actorVotes: Record<string, 'approve' | 'reject'>;
  stance: string;
  comment: string;
  submittedAt: string;
}

export interface Argument {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userRank: RankLevel;
  issueId: string;
  stance: string;
  comment: string;
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down' | null;
  submittedAt: string;
  userCatAvatar?: CatProfile;
}

export interface CommunityConsensus {
  issueId: string;
  avgEffectiveness: number;
  avgEfficiency: number;
  avgEquity: number;
  avgResponsiveness: number;
  totalVoters: number;
  winnerPercentage: number;
  loserPercentage: number;
  totalParticipants?: number;
  scores?: EvaluationScores;
  winnerStance?: string;
  actorConsensus?: Array<{
    actorId: string;
    actorName: string;
    approvalRate: number;
    consensusLabel: string;
  }>;
}

export interface ActorCard {
  id: string;
  name: string;
  role: string;
  description: string;
  imageEmoji: string;
}
