/**
 * Gradient & filter SVG milik satu instance CatAvatar.
 * Semua ID diberi prefix `uid` agar tidak bentrok antar avatar di halaman yang sama.
 */
export default function CatDefs({ uid, eyeColor }: { uid: string; eyeColor: string }) {
  return (
    <defs>
      {/* Background Radial Gradient */}
      <radialGradient id={`${uid}-catBgGrad`} cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#FFF1ED" />
        <stop offset="70%" stopColor="#FFE4DE" />
        <stop offset="100%" stopColor="#FED7AA" />
      </radialGradient>

      {/* Eye Iris Gradient */}
      <radialGradient id={`${uid}-eyeGrad`} cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
        <stop offset="30%" stopColor={eyeColor} />
        <stop offset="100%" stopColor="#064E3B" />
      </radialGradient>

      {/* Gold Shimmer Gradient */}
      <linearGradient id={`${uid}-goldGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="50%" stopColor="#EAB308" />
        <stop offset="100%" stopColor="#CA8A04" />
      </linearGradient>

      {/* Ruby Royal Gradient */}
      <linearGradient id={`${uid}-rubyGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="50%" stopColor="#991B1B" />
        <stop offset="100%" stopColor="#450A0A" />
      </linearGradient>

      {/* Subtle Inner Shadow Filter */}
      <filter id={`${uid}-softGlow`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      {/* Admin Exclusive: Aura Glow Radial */}
      <radialGradient id={`${uid}-adminAuraGlow`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
        <stop offset="30%" stopColor="#FDE047" stopOpacity="0.85" />
        <stop offset="65%" stopColor="#38BDF8" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
      </radialGradient>

      {/* Admin Exclusive: Star 24K Gold Gradient */}
      <linearGradient id={`${uid}-adminStarGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFBEB" />
        <stop offset="25%" stopColor="#FEF08A" />
        <stop offset="60%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>

      {/* Admin Exclusive: Secondary Rays Gold Gradient */}
      <linearGradient id={`${uid}-adminGoldGrad2`} x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FEF9C3" />
        <stop offset="50%" stopColor="#EAB308" />
        <stop offset="100%" stopColor="#78350F" />
      </linearGradient>

      {/* Admin Exclusive: Celestial Gem Crystal Gradient */}
      <linearGradient id={`${uid}-adminGemGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E0F2FE" />
        <stop offset="35%" stopColor="#38BDF8" />
        <stop offset="75%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#0369A1" />
      </linearGradient>

      {/* Admin Exclusive: Royal Sash Ribbon Gradient */}
      <linearGradient id={`${uid}-adminSashGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#DC2626" />
        <stop offset="50%" stopColor="#B91C1C" />
        <stop offset="100%" stopColor="#7F1D1D" />
      </linearGradient>

      {/* Admin Exclusive: Specular Sparkle Filter */}
      <filter id={`${uid}-adminGlowFilter`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur1" />
        <feGaussianBlur in="SourceGraphic" stdDeviation="5.5" result="blur2" />
        <feMerge>
          <feMergeNode in="blur2" />
          <feMergeNode in="blur1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}
