import React from 'react';
import {
  MdHome,
  MdFactCheck,
  MdRateReview,
  MdAssignmentTurnedIn,
  MdHistoryEdu,
  MdFolderOpen,
  MdEdit,
  MdRemove,
  MdLocalLibrary,
  MdTune,
  MdRadar,
  MdMilitaryTech,
  MdCheckCircle,
  MdVerified,
  MdArrowBack,
  MdArrowForward,
  MdSecurity,
  MdShield,
  MdBolt,
  MdBadge,
  MdLock,
  MdLockOpen,
  MdLocalGasStation,
  MdTrackChanges,
  MdAccountBalanceWallet,
  MdScale,
  MdForum,
  MdInsights,
  MdClose,
  MdCheck,
  MdEditNote,
  MdWorkspacePremium,
  MdDownload,
  MdLink,
  MdCameraAlt,
  MdChat,
  MdFormatQuote,
  MdThumbUp,
  MdThumbDown,
  MdTrendingUp,
  MdInfo,
  MdShare,
  MdPerson,
  MdPersonOutline,
  MdVisibility,
  MdVisibilityOff,
  MdHelpOutline,
  MdNotifications,
  MdNotificationsActive,
  MdCampaign,
  MdAdd,
  MdStar,
  MdBarChart,
  MdPoll,
  MdSpeed,
  MdFlag,
  MdHistory,
  MdSearch,
  MdFilterList,
  MdSettings,
  MdAdminPanelSettings,
  MdDelete,
  MdOpenInNew,
  MdLeaderboard,
  MdSchool,
  MdHealthAndSafety,
  MdDevices,
  MdForest,
  MdAccountBalance,
} from 'react-icons/md';

// Comprehensive Icon Map for Google Stitch Material Symbols
const ICON_MAP: Record<string, React.ComponentType<{ size?: number | string; className?: string; style?: React.CSSProperties }>> = {
  // Navigation & Core App
  home: MdHome,
  beranda: MdHome,
  fact_check: MdFactCheck,
  evaluasi: MdFactCheck,
  evaluate: MdFactCheck,
  rate_review: MdRateReview,
  assignment_turned_in: MdAssignmentTurnedIn,
  history_edu: MdHistoryEdu,
  local_library: MdLocalLibrary,
  tune: MdTune,
  radar: MdRadar,
  military_tech: MdMilitaryTech,
  leaderboard: MdLeaderboard,
  trophy: MdLeaderboard,

  // Status & Validation
  check_circle: MdCheckCircle,
  verified: MdVerified,
  verified_user: MdSecurity,
  lock: MdLock,
  lock_open: MdLockOpen,
  info: MdInfo,

  // Direction & Flow
  arrow_back: MdArrowBack,
  arrow_forward: MdArrowForward,
  close: MdClose,
  done: MdCheck,
  check: MdCheck,
  remove: MdRemove,

  // Brand & Policy
  policy: MdSecurity,
  shield: MdShield,
  bolt: MdBolt,
  badge: MdBadge,
  local_gas_station: MdLocalGasStation,
  admin_panel_settings: MdAdminPanelSettings,
  school: MdSchool,
  health_and_safety: MdHealthAndSafety,
  devices: MdDevices,
  forest: MdForest,
  eco: MdForest,
  account_balance: MdAccountBalance,

  // Evaluation Criteria Dimensions
  target: MdTrackChanges,
  account_balance_wallet: MdAccountBalanceWallet,
  balance: MdScale,
  forum: MdForum,
  insights: MdInsights,
  bar_chart: MdBarChart,
  poll: MdPoll,
  speed: MdSpeed,
  folder_open: MdFolderOpen,

  // Forms & Actions
  edit: MdEdit,
  edit_note: MdEditNote,
  workspace_premium: MdWorkspacePremium,
  download: MdDownload,
  link: MdLink,
  share: MdShare,
  add: MdAdd,
  star: MdStar,
  flag: MdFlag,
  history: MdHistory,
  delete: MdDelete,
  trash: MdDelete,
  open_in_new: MdOpenInNew,
  launch: MdOpenInNew,
  search: MdSearch,
  filter_list: MdFilterList,
  settings: MdSettings,

  // Notifications & Alerts
  notifications: MdNotifications,
  notifications_active: MdNotificationsActive,
  campaign: MdCampaign,

  // Media & Social
  camera_alt: MdCameraAlt,
  chat: MdChat,
  format_quote: MdFormatQuote,
  thumb_up: MdThumbUp,
  thumb_down: MdThumbDown,
  trending_up: MdTrendingUp,
  person: MdPerson,
  person_outline: MdPersonOutline,
  visibility: MdVisibility,
  visibility_off: MdVisibilityOff,
};

interface IconProps {
  name: string;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export default function Icon({ name, size = '1.2em', className = '', style }: IconProps) {
  const normalizedKey = name.toLowerCase().trim().replace(/[\s-]+/g, '_');
  const Component = ICON_MAP[normalizedKey] || MdHelpOutline;

  return (
    <Component
      size={size}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
