import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0 || pathnames[0] !== 'admin') return null;

  return (
    <nav className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant dark:text-zinc-400 mb-6">
      <Link to="/admin" className="hover:text-primary transition-colors flex items-center gap-1">
        <span className="material-symbols-outlined text-[16px]">home</span>
        Dashboard
      </Link>
      {pathnames.slice(1).map((value, index) => {
        const to = `/admin/${pathnames.slice(1, index + 2).join('/')}`;
        const isLast = index === pathnames.length - 2;

        const formatted = value.charAt(0).toUpperCase() + value.slice(1);

        return (
          <React.Fragment key={to}>
            <span className="material-symbols-outlined text-[14px] opacity-40">chevron_right</span>
            {isLast ? (
              <span className="text-secondary dark:text-teal-400 font-bold">{formatted}</span>
            ) : (
              <Link to={to} className="hover:text-primary transition-colors">
                {formatted}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
