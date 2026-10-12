import React from 'react';

interface CatVisualIconProps {
  name: string;
  size?: number | string;
  className?: string;
  color?: string;
}

/**
 * CatVisualIcon: Original Vector SVG Icons for Cat Breeds, Wardrobe Slots, and Costumes.
 * Replaces generic emojis with handcrafted, premium vector illustrations for all 31 wardrobe items.
 */
export default function CatVisualIcon({
  name,
  size = 28,
  className = '',
  color,
}: CatVisualIconProps) {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;
  const key = name.toLowerCase().trim();

  switch (key) {
    // ==========================================
    // 1. RAS KUCING ORIGINAL (3 Ras Kucing)
    // ==========================================
    case 'breed_domestik':
    case 'domestik':
      return (
        <svg viewBox="0 0 48 48" width={pixelSize} height={pixelSize} className={className} fill="none">
          <circle cx="24" cy="25" r="16" fill="#F97316" />
          <path d="M12 18L10 6L21 14" fill="#EA580C" stroke="#C2410C" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M13 16L12 8L19 14" fill="#FDBA74" />
          <path d="M36 18L38 6L27 14" fill="#EA580C" stroke="#C2410C" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M35 16L36 8L29 14" fill="#FDBA74" />
          <path d="M18 17L21 21L24 18L27 21L30 17" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="17.5" cy="25" rx="3.5" ry="4" fill="#10B981" />
          <circle cx="18" cy="24" r="1.5" fill="#047857" />
          <circle cx="16.5" cy="23.5" r="1" fill="#FFFFFF" />
          <ellipse cx="30.5" cy="25" rx="3.5" ry="4" fill="#10B981" />
          <circle cx="30" cy="24" r="1.5" fill="#047857" />
          <circle cx="29.5" cy="23.5" r="1" fill="#FFFFFF" />
          <ellipse cx="24" cy="31" rx="6" ry="4.5" fill="#FFEDD5" />
          <path d="M22.5 29.5H25.5L24 31.5Z" fill="#F43F5E" />
          <path d="M24 31.5V33M21.5 33C22.5 34 25.5 34 26.5 33" stroke="#9A3412" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M9 28L16 29M9 31L16 31M39 28L32 29M39 31L32 31" stroke="#FED7AA" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );

    case 'breed_persia':
    case 'persia':
      return (
        <svg viewBox="0 0 48 48" width={pixelSize} height={pixelSize} className={className} fill="none">
          <circle cx="13" cy="24" r="7" fill="#E2E8F0" />
          <circle cx="35" cy="24" r="7" fill="#E2E8F0" />
          <circle cx="16" cy="32" r="6" fill="#F1F5F9" />
          <circle cx="32" cy="32" r="6" fill="#F1F5F9" />
          <circle cx="24" cy="25" r="15.5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.2" />
          <path d="M14 17C12 11 17 8 20 13" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.2" />
          <circle cx="16" cy="13" r="2.5" fill="#FDA4AF" />
          <path d="M34 17C36 11 31 8 28 13" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.2" />
          <circle cx="32" cy="13" r="2.5" fill="#FDA4AF" />
          <path d="M10 26C8 28 9 32 12 33M38 26C40 28 39 32 36 33" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
          <circle cx="18" cy="24" r="3.8" fill="#3B82F6" />
          <circle cx="18" cy="23.5" r="1.8" fill="#1D4ED8" />
          <circle cx="17" cy="22.5" r="1.2" fill="#FFFFFF" />
          <circle cx="30" cy="24" r="3.8" fill="#3B82F6" />
          <circle cx="30" cy="23.5" r="1.8" fill="#1D4ED8" />
          <circle cx="29" cy="22.5" r="1.2" fill="#FFFFFF" />
          <circle cx="24" cy="27" r="1.8" fill="#FB7185" />
          <path d="M21.5 29.5C22.5 30.5 25.5 30.5 26.5 29.5" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );

    case 'breed_siam':
    case 'siam':
      return (
        <svg viewBox="0 0 48 48" width={pixelSize} height={pixelSize} className={className} fill="none">
          <path d="M11 20L7 4L22 13" fill="#451A03" stroke="#291203" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M13 17L9 7L19 14" fill="#78350F" />
          <path d="M37 20L41 4L26 13" fill="#451A03" stroke="#291203" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M35 17L39 7L29 14" fill="#78350F" />
          <ellipse cx="24" cy="26" rx="14.5" ry="15.5" fill="#F1F5F9" />
          <path d="M17 19C19 17 29 17 31 19C33 22 34 26 32 30C30 34 27 35.5 24 35.5C21 35.5 18 34 16 30C14 26 15 22 17 19Z" fill="#5C2607" />
          <ellipse cx="18" cy="24" rx="3.5" ry="2.6" fill="#0284C7" transform="rotate(-5 18 24)" />
          <circle cx="18" cy="24" r="1.4" fill="#0369A1" />
          <circle cx="17.2" cy="23.2" r="0.9" fill="#FFFFFF" />
          <ellipse cx="30" cy="24" rx="3.5" ry="2.6" fill="#0284C7" transform="rotate(5 30 24)" />
          <circle cx="30" cy="24" r="1.4" fill="#0369A1" />
          <circle cx="29.2" cy="23.2" r="0.9" fill="#FFFFFF" />
          <path d="M22.5 28.5H25.5L24 30.5Z" fill="#1C0A00" />
          <path d="M24 30.5V32M22 32.5C23 33.2 25 33.2 26 32.5" stroke="#FDE68A" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );

    // ==========================================
    // 2. KATEGORI / SLOT LEMARI KOSTUM
    // ==========================================
    case 'slot_head':
    case 'head':
      return (
        <svg viewBox="0 0 24 24" width={pixelSize} height={pixelSize} fill="none" stroke={color || '#FF6B4A'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17h18M6 17a6 6 0 0 1 12 0M18 17h4a2 2 0 0 0-2-2h-2" />
        </svg>
      );

    case 'slot_eyes':
    case 'eyes':
      return (
        <svg viewBox="0 0 24 24" width={pixelSize} height={pixelSize} fill="none" stroke={color || '#3B82F6'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="12" r="4" />
          <circle cx="18" cy="12" r="4" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
      );

    case 'slot_body':
    case 'body':
      return (
        <svg viewBox="0 0 24 24" width={pixelSize} height={pixelSize} fill="none" stroke={color || '#10B981'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
        </svg>
      );

    case 'slot_accessory':
    case 'accessory':
      return (
        <svg viewBox="0 0 24 24" width={pixelSize} height={pixelSize} fill="none" stroke={color || '#D97706'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5" />
          <rect x="3" y="9" width="18" height="13" rx="2" />
          <circle cx="12" cy="15" r="2" />
        </svg>
      );

    // ==========================================
    // 3. ITEM KOSTUM SPESIFIK - LEVEL 1
    // ==========================================
    case 'head_relawan':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <path d="M6 22C6 15 11 11 18 11C23 11 26 14 26 22H6Z" fill="#FF6B4A" />
          <path d="M4 22H29C29 22 28 25 24 25H6C4.5 25 4 22 4 22Z" fill="#EA580C" />
          <circle cx="18" cy="11" r="2" fill="#FFFFFF" />
          <path d="M12 18H20" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'eyes_baca':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <circle cx="10" cy="16" r="5" stroke="#475569" strokeWidth="2" fill="rgba(148, 163, 184, 0.15)" />
          <circle cx="22" cy="16" r="5" stroke="#475569" strokeWidth="2" fill="rgba(148, 163, 184, 0.15)" />
          <path d="M15 15C16 14 16 14 17 15" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <path d="M5 15L3 14M27 15L29 14" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'body_kaos':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <path d="M6 10L10 6L14 8C15 9 17 9 18 8L22 6L26 10L23 13L21 11V25H11V11L9 13L6 10Z" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1.2" />
          <path d="M14 8C15 9 17 9 18 8" stroke="#1D4ED8" strokeWidth="1.5" />
        </svg>
      );

    case 'acc_totebag':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <path d="M12 12V8C12 6.5 13.5 5 16 5C18.5 5 20 6.5 20 8V12" stroke="#92400E" strokeWidth="2" />
          <rect x="8" y="12" width="16" height="15" rx="2.5" fill="#D97706" stroke="#B45309" strokeWidth="1.2" />
          <path d="M12 18H20M12 21H17" stroke="#FEF3C7" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    // ==========================================
    // 4. ITEM KOSTUM SPESIFIK - LEVEL 2
    // ==========================================
    case 'head_beanie':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <ellipse cx="16" cy="16" rx="10" ry="8" fill="#475569" />
          <rect x="5" y="19" width="22" height="6" rx="3" fill="#334155" />
          <circle cx="16" cy="7" r="3" fill="#94A3B8" />
          <line x1="10" y1="21" x2="10" y2="23" stroke="#64748B" strokeWidth="1.5" />
          <line x1="16" y1="21" x2="16" y2="23" stroke="#64748B" strokeWidth="1.5" />
          <line x1="22" y1="21" x2="22" y2="23" stroke="#64748B" strokeWidth="1.5" />
        </svg>
      );

    case 'eyes_kotak':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <rect x="5" y="12" width="9" height="8" rx="2" stroke="#0F172A" strokeWidth="2.5" fill="rgba(0,0,0,0.05)" />
          <rect x="18" y="12" width="9" height="8" rx="2" stroke="#0F172A" strokeWidth="2.5" fill="rgba(0,0,0,0.05)" />
          <line x1="14" y1="15" x2="18" y2="15" stroke="#0F172A" strokeWidth="2.5" />
        </svg>
      );

    case 'body_hoodie':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <path d="M6 11L10 7L13 9C15 10 17 10 19 9L22 7L26 11L23 14L21 12V25H11V12L9 14L6 11Z" fill="#1E293B" stroke="#0F172A" strokeWidth="1.2" />
          <path d="M14 13V18M18 13V18" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="13" y="19" width="6" height="5" rx="1.5" fill="#334155" />
        </svg>
      );

    case 'acc_smartphone':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <rect x="10" y="5" width="12" height="22" rx="3" fill="#1E293B" stroke="#0284C7" strokeWidth="1.5" />
          <rect x="11.5" y="8" width="9" height="15" rx="1" fill="#0284C7" />
          <line x1="14" y1="12" x2="18" y2="12" stroke="#E0F2FE" strokeWidth="1" />
          <line x1="14" y1="15" x2="17" y2="15" stroke="#E0F2FE" strokeWidth="1" />
          <circle cx="16" cy="25" r="1" fill="#94A3B8" />
        </svg>
      );

    // ==========================================
    // 5. ITEM KOSTUM SPESIFIK - LEVEL 3
    // ==========================================
    case 'head_baret':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <ellipse cx="17" cy="16" rx="12" ry="6" fill="#B45309" transform="rotate(-8 17 16)" />
          <rect x="6" y="18" width="18" height="4" rx="2" fill="#78350F" transform="rotate(-4 6 18)" />
          <circle cx="14" cy="16" r="2.5" fill="#FDE047" stroke="#CA8A04" strokeWidth="0.8" />
        </svg>
      );

    case 'eyes_lensa_detektif':
    case 'lensa_detektif':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <circle cx="14" cy="14" r="7" stroke="#D97706" strokeWidth="2.5" fill="rgba(254, 243, 199, 0.45)" />
          <line x1="19" y1="19" x2="26" y2="26" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />
          <path d="M12 11C14 11 15 12 15 14" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'body_rompi':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <path d="M8 8L12 6L16 9L20 6L24 8L22 25H10L8 8Z" fill="#EA580C" stroke="#C2410C" strokeWidth="1.2" />
          <rect x="10" y="14" width="12" height="3" fill="#FDE047" stroke="#CA8A04" strokeWidth="0.8" />
          <rect x="10" y="19" width="12" height="3" fill="#FDE047" stroke="#CA8A04" strokeWidth="0.8" />
          <line x1="16" y1="9" x2="16" y2="25" stroke="#9A3412" strokeWidth="1.5" />
        </svg>
      );

    case 'acc_clipboard':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <rect x="8" y="7" width="16" height="21" rx="2.5" fill="#F59E0B" stroke="#B45309" strokeWidth="1.2" />
          <rect x="12" y="5" width="8" height="4" rx="1.5" fill="#78350F" />
          <rect x="10" y="11" width="12" height="14" rx="1" fill="#FFFFFF" />
          <line x1="12" y1="14" x2="17" y2="14" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="12" y1="17" x2="20" y2="17" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="12" y1="20" x2="18" y2="20" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );

    // ==========================================
    // 6. ITEM KOSTUM SPESIFIK - LEVEL 4
    // ==========================================
    case 'head_fedora':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <ellipse cx="16" cy="22" rx="14" ry="4" fill="#334155" />
          <path d="M9 21L11 12C12 10 14 11 16 10C18 11 20 10 21 12L23 21H9Z" fill="#1E293B" />
          <rect x="9.5" y="18" width="13" height="3" fill="#D97706" />
        </svg>
      );

    case 'eyes_frame_emas':
    case 'eyes_gold':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <circle cx="10" cy="16" r="5" stroke="#EAB308" strokeWidth="2.2" fill="rgba(254, 240, 138, 0.25)" />
          <circle cx="22" cy="16" r="5" stroke="#EAB308" strokeWidth="2.2" fill="rgba(254, 240, 138, 0.25)" />
          <line x1="15" y1="15" x2="17" y2="15" stroke="#CA8A04" strokeWidth="2.5" />
          <path d="M5 14L2 13M27 14L30 13" stroke="#EAB308" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'body_jas_formal':
    case 'body_jas':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <path d="M7 10L11 6L21 6L25 10L22 13L21 12V25H11V12L10 13L7 10Z" fill="#0F172A" />
          <path d="M13 6L16 15L19 6" fill="#F8FAFC" />
          <polygon points="16,10 17.5,15 16,19 14.5,15" fill="#DC2626" />
          <path d="M11 11L14 17L11 25" stroke="#334155" strokeWidth="1.2" />
          <path d="M21 11L18 17L21 25" stroke="#334155" strokeWidth="1.2" />
        </svg>
      );

    case 'acc_koper':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <path d="M13 11V8C13 6.8 14 6 16 6C18 6 19 6.8 19 8V11" stroke="#451A03" strokeWidth="1.8" />
          <rect x="7" y="11" width="18" height="15" rx="3" fill="#78350F" stroke="#451A03" strokeWidth="1.5" />
          <rect x="11" y="11" width="2" height="15" fill="#B45309" />
          <rect x="19" y="11" width="2" height="15" fill="#B45309" />
          <rect x="14" y="17" width="4" height="3" rx="0.5" fill="#FDE047" stroke="#CA8A04" strokeWidth="0.8" />
        </svg>
      );

    // ==========================================
    // 7. ITEM KOSTUM SPESIFIK - LEVEL 5
    // ==========================================
    case 'head_toga_advokat':
    case 'head_toga':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <polygon points="16,6 28,11 16,16 4,11" fill="#1E3A8A" stroke="#172554" strokeWidth="1.2" />
          <rect x="9" y="14" width="14" height="7" rx="3" fill="#172554" />
          <path d="M25 12V22" stroke="#FDE047" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="25" cy="22" r="1.5" fill="#FDE047" />
        </svg>
      );

    case 'eyes_monokel':
    case 'eyes_monocle':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <circle cx="20" cy="15" r="6.5" stroke="#CA8A04" strokeWidth="2.5" fill="rgba(254, 243, 199, 0.45)" />
          <path d="M20 21.5C20 25.5 17 28 13 28" stroke="#EAB308" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round" />
        </svg>
      );

    case 'body_jubah_advokat':
    case 'body_jubah':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <path d="M7 8L16 5L25 8L28 27H4L7 8Z" fill="#172554" stroke="#0F172A" strokeWidth="1.5" />
          <path d="M8 8L19 27H24L11 8Z" fill="#DC2626" />
          <circle cx="16" cy="11" r="2" fill="#EAB308" />
        </svg>
      );

    case 'acc_palu_sidang':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <rect x="7" y="10" width="10" height="6" rx="2" fill="#9A3412" stroke="#7C2D12" strokeWidth="1.2" transform="rotate(-30 12 13)" />
          <line x1="12" y1="15" x2="24" y2="26" stroke="#B45309" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="23" cy="25" rx="5" ry="2.5" fill="#78350F" />
        </svg>
      );

    // ==========================================
    // 8. ITEM KOSTUM SPESIFIK - LEVEL 6
    // ==========================================
    case 'head_peci_karismatik':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <ellipse cx="16" cy="15" rx="11" ry="3" fill="#18181B" />
          <path d="M5 15C5 12 8 8 16 8C24 8 27 12 27 15V22H5V15Z" fill="#09090B" />
          <rect x="5" y="21" width="22" height="3" fill="#18181B" />
          <circle cx="16" cy="12" r="1.5" fill="#FDE047" />
        </svg>
      );

    case 'eyes_aviator_diplomat':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <path d="M5 13C5 11 13 11 13 14C13 18 10 21 8 21C6 21 5 18 5 13Z" fill="#18181B" stroke="#71717A" strokeWidth="1.5" />
          <path d="M19 14C19 11 27 11 27 13C27 18 26 21 24 21C22 21 19 18 19 14Z" fill="#18181B" stroke="#71717A" strokeWidth="1.5" />
          <line x1="13" y1="13" x2="19" y2="13" stroke="#D4D4D8" strokeWidth="2" />
          <line x1="13" y1="15" x2="19" y2="15" stroke="#71717A" strokeWidth="1" />
        </svg>
      );

    case 'body_tuxedo_menteri':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <path d="M7 10L11 6L21 6L25 10L22 13L21 12V25H11V12L10 13L7 10Z" fill="#581C87" stroke="#3B0764" strokeWidth="1.2" />
          <path d="M13 6L16 15L19 6" fill="#FFFFFF" />
          <polygon points="15,10 17,10 16,13" fill="#000000" />
          {/* Selempang Kenegaraan Emas */}
          <line x1="10" y1="8" x2="22" y2="24" stroke="#F59E0B" strokeWidth="3" />
        </svg>
      );

    case 'acc_berkas_rahasia':
    case 'acc_map':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <rect x="7" y="8" width="18" height="16" rx="2" fill="#DC2626" stroke="#991B1B" strokeWidth="1.2" />
          <path d="M7 12H13L15 14H25V8H7V12Z" fill="#EF4444" />
          <circle cx="16" cy="18" r="3" fill="#FEE2E2" stroke="#991B1B" strokeWidth="1" />
          <path d="M15 18L16 19L17.5 17" stroke="#991B1B" strokeWidth="1" strokeLinecap="round" />
        </svg>
      );

    // ==========================================
    // 9. ITEM KOSTUM SPESIFIK - LEVEL 7
    // ==========================================
    case 'head_mahkota_raja':
    case 'head_mahkota':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <path d="M5 22L7 12L12 17L16 9L20 17L25 12L27 22H5Z" fill="#EAB308" stroke="#CA8A04" strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="5" y="22" width="22" height="4" rx="2" fill="#CA8A04" />
          <circle cx="7" cy="12" r="1.5" fill="#EF4444" />
          <circle cx="16" cy="9" r="1.8" fill="#3B82F6" />
          <circle cx="25" cy="12" r="1.5" fill="#EF4444" />
          <circle cx="16" cy="24" r="1.5" fill="#EF4444" />
        </svg>
      );

    case 'eyes_sorot_bijak':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <circle cx="11" cy="16" r="5" stroke="#FDE047" strokeWidth="2.5" fill="rgba(254, 240, 138, 0.45)" />
          <circle cx="21" cy="16" r="5" stroke="#FDE047" strokeWidth="2.5" fill="rgba(254, 240, 138, 0.45)" />
          <line x1="16" y1="16" x2="16" y2="16" stroke="#EAB308" strokeWidth="2" />
          {/* Sinar Kilauan Bintang Sorot */}
          <path d="M5 9L8 11M27 9L24 11M16 8V11" stroke="#FACC15" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'body_jubah_beludru':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <path d="M7 8L16 5L25 8L28 27H4L7 8Z" fill="#991B1B" stroke="#7F1D1D" strokeWidth="1.5" />
          {/* Kerah Bulu Putih Raja */}
          <ellipse cx="16" cy="9" rx="7" ry="3.5" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
          <line x1="16" y1="12" x2="16" y2="27" stroke="#FDE047" strokeWidth="2" />
        </svg>
      );

    case 'acc_tongkat_scepter':
    case 'acc_tongkat':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <line x1="10" y1="26" x2="22" y2="8" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
          <circle cx="23" cy="7" r="4.5" fill="#EAB308" stroke="#CA8A04" strokeWidth="1.5" />
          <circle cx="23" cy="7" r="1.8" fill="#EF4444" />
        </svg>
      );

    // ==========================================
    // 10. ACHIEVEMENTS & EXTRA ITEMS
    // ==========================================
    case 'acc_megafon':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <path d="M9 13H14L22 8V24L14 19H9C7.9 19 7 18.1 7 17V15C7 13.9 7.9 13 9 13Z" fill="#EF4444" stroke="#B91C1C" strokeWidth="1.2" />
          <path d="M22 13C23.5 14 24.5 15 24.5 16C24.5 17 23.5 18 22 19" stroke="#FDE047" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 19V25" stroke="#7F1D1D" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'head_bando_kucing':
    case 'bando_pita':
    case 'acc_pita':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          {/* Bando Lengkung Kepala */}
          <path d="M6 22C6 14 10 9 16 9C22 9 26 14 26 22" stroke="#BE185D" strokeWidth="2.5" strokeLinecap="round" />
          {/* Pita Cantik Pink */}
          <path d="M16 11C13 8 10 13 14 14C16 14.5 16 14.5 16 14.5" fill="#EC4899" stroke="#9D174D" strokeWidth="1" />
          <path d="M16 11C19 8 22 13 18 14C16 14.5 16 14.5 16 14.5" fill="#EC4899" stroke="#9D174D" strokeWidth="1" />
          <circle cx="16" cy="13" r="2.2" fill="#F43F5E" />
          <path d="M15 15L13 20" stroke="#EC4899" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M17 15L19 20" stroke="#EC4899" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'head_wig':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <circle cx="10" cy="15" r="4" fill="#E2E8F0" />
          <circle cx="22" cy="15" r="4" fill="#E2E8F0" />
          <circle cx="16" cy="12" r="5" fill="#F8FAFC" />
          <rect x="8" y="18" width="5" height="8" rx="2.5" fill="#CBD5E1" />
          <rect x="19" y="18" width="5" height="8" rx="2.5" fill="#CBD5E1" />
        </svg>
      );

    case 'body_kemeja':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <path d="M7 11L11 7L14 9L18 9L21 7L25 11L22 13L21 12V25H11V12L10 13L7 11Z" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.2" />
          <line x1="16" y1="9" x2="16" y2="25" stroke="#CBD5E1" strokeWidth="1.5" />
          <circle cx="16" cy="13" r="1" fill="#475569" />
          <circle cx="16" cy="17" r="1" fill="#475569" />
          <circle cx="16" cy="21" r="1" fill="#475569" />
        </svg>
      );

    case 'acc_syal':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <ellipse cx="16" cy="13" rx="10" ry="4" fill="#E11D48" stroke="#BE123C" strokeWidth="1.2" />
          <rect x="18" y="14" width="5" height="12" rx="1.5" fill="#E11D48" stroke="#BE123C" strokeWidth="1.2" />
        </svg>
      );

    case 'acc_lanyard':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <path d="M10 5L16 16L22 5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
          <rect x="12" y="16" width="8" height="11" rx="1.5" fill="#FFFFFF" stroke="#64748B" strokeWidth="1.2" />
          <rect x="14" y="19" width="4" height="3" rx="0.5" fill="#93C5FD" />
        </svg>
      );

    case 'acc_dasi':
      return (
        <svg viewBox="0 0 32 32" width={pixelSize} height={pixelSize} fill="none">
          <polygon points="14,6 18,6 17,9 15,9" fill="#B91C1C" />
          <polygon points="15,9 17,9 18.5,23 16,27 13.5,23" fill="#DC2626" stroke="#991B1B" strokeWidth="1" />
        </svg>
      );

    // Fallback default: hanger garment icon (bukan bintang)
    default:
      return (
        <svg viewBox="0 0 24 24" width={pixelSize} height={pixelSize} fill="none" stroke={color || '#FF6B4A'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="7" r="3" />
          <path d="M6 19a6 6 0 0 1 12 0" />
        </svg>
      );
  }
}
