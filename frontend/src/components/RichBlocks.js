// Renders content blocks: { h }, { p }, { ul }, { ol }, { table: { head, rows } }
export default function RichBlocks({ blocks = [] }) {
    return blocks.map((b, i) => {
        if (b.h) {
            return <h3 key={i} className="mt-6 text-base font-bold text-slate-900">{b.h}</h3>;
        }
        if (b.p) {
            return <p key={i} className="mt-3 text-[15px] leading-7 text-slate-700">{b.p}</p>;
        }
        if (b.ul) {
            return (
                <ul key={i} className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-7 text-slate-700 marker:text-blue-500">
                    {b.ul.map((t, k) => <li key={k}>{t}</li>)}
                </ul>
            );
        }
        if (b.ol) {
            return (
                <ol key={i} className="mt-3 list-decimal space-y-1.5 pl-5 text-[15px] leading-7 text-slate-700 marker:font-semibold marker:text-blue-700">
                    {b.ol.map((t, k) => <li key={k}>{t}</li>)}
                </ol>
            );
        }
        if (b.table) {
            return (
                <div key={i} className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[420px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                            <tr>{b.table.head.map((h) => <th key={h} className="p-3">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {b.table.rows.map((r, k) => (
                                <tr key={k} className="transition hover:bg-slate-50">
                                    {r.map((c, j) => <td key={j} className={`p-3 ${j === 0 ? 'font-medium text-slate-900' : 'text-slate-700'}`}>{c}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
        return null;
    });
}