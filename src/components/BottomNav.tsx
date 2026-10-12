'use client';

import { usePathname, useRouter } from 'next/navigation';
import Icon from './Icon';
import styles from './BottomNav.module.css';

const NAV_ITEMS = [
  { path: '/home', label: 'Isu', icon: 'local_library' },
  { path: '/evaluate', label: 'Evaluasi', icon: 'tune' },
  { path: '/consensus', label: 'Konsensus', icon: 'radar' },
  { path: '/profile', label: 'Profil', icon: 'military_tech' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show on landing and admin pages
  if (pathname === '/' || pathname?.startsWith('/admin')) return null;

  return (
    <nav className={styles.nav} id="bottom-navigation">
      <div className={styles.dock}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
          return (
            <button
              key={item.path}
              className={`${styles.item} ${isActive ? styles.active : ''}`}
              onClick={() => router.push(item.path)}
              id={`nav-${item.label.toLowerCase()}`}
              type="button"
            >
              <Icon name={item.icon} size={20} className={styles.icon} />
              <span className={styles.label}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
