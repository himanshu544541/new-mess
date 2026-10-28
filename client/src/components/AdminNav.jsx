import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldCheck, Sliders, DollarSign, PieChart, ListChecks, Star } from 'lucide-react';

const AdminNav = () => {
  const navItems = [
    { to: '/admin/verifications', label: 'Verifications', icon: ShieldCheck },
    { to: '/admin/config', label: 'Pricing Config', icon: Sliders },
    { to: '/admin/settlements', label: 'Vendor Settlements', icon: DollarSign },
    { to: '/admin/margin', label: 'Margin Report', icon: PieChart },
    { to: '/admin/checkins', label: 'Check-in Audit', icon: ListChecks },
    { to: '/admin/ratings', label: 'Private Ratings', icon: Star }
  ];

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-purple-100 text-purple-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminNav;

