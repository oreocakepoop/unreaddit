import React from 'react';

export default function SimpleBrandLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
        <span className="text-xl font-bold text-primary">U</span>
      </div>
      <span className="font-semibold text-lg">Unreaddit</span>
    </div>
  );
}
