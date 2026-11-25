'use client';
import { useEffect, useState } from 'react';
import { cld } from '@/lib/img';

export default function CategoryIcon({ c, size = 40, rounded = 'rounded-xl', className = '' }) {
    const [failed, setFailed] = useState(false);
    useEffect(() => setFailed(false), [c?.image]);
    const box = { width: size, height: size };

    if (c?.image && !failed) {
        return (
            <img
                src={cld(c.image, Math.round(size * 3))}
                alt={c.name || ''}
                loading="lazy"
                draggable={false}
                style={box}
                onError={() => setFailed(true)}
                className={`shrink-0 border border-slate-200 bg-slate-50 object-cover ${rounded} ${className}`}
            />
        );
    }
    return (
        <span style={{ ...box, fontSize: Math.round(size * 0.55) }} className={`grid shrink-0 place-items-center border border-slate-200 bg-slate-50 leading-none ${rounded} ${className}`}>
            {c?.icon || '🧸'}
        </span>
    );
}