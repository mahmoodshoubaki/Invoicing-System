'use client';

import { useEffect, useRef, useState } from "react";

export default function Menu({children, menuButtonElement}) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClick(e) {
          if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
      }, []);

    return (
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {menuButtonElement}
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-2 w-25 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            {children}
          </div>
        )}
      </div>
    );
}