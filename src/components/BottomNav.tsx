'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icon';
import styles from './BottomNav.module.css';

const NAV_ITEMS = [
  { path: '/home', label: 'Beranda', icon: 'home' },
  { path: '/evaluate', label: 'Evaluasi', icon: 'fact_check' },
  { path: '/leaderboard', label: 'Leaderboard', icon: 'leaderboard' },
  { path: '/profile', label: 'Profil', icon: 'military_tech' },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Don't show on landing and admin pages
  if (pathname === '/' || pathname?.startsWith('/admin')) return null;

  return (
    <nav className={styles.nav} id="bottom-navigation" aria-label="Navigasi utama">
      <div className={styles.dock}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
          return (
            // <Link> (bukan button + router.push): bisa dibuka di tab baru, di-prefetch, & dikenali sebagai navigasi
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.item} ${isActive ? styles.active : ''}`}
              aria-current={isActive ? 'page' : undefined}
              id={`nav-${item.label.toLowerCase()}`}
            >
              <Icon name={item.icon} size={20} className={styles.icon} />
              <span className={styles.label}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
