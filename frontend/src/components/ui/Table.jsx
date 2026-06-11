export default function Table({ children }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
                {children}
            </table>
        </div>
    );
}

export function Th({ children }) {
    return (
        <th className="text-left px-4 py-3 font-semibold text-gray-600">
            {children}
        </th>
    );
}

export function Td({ children, className = '' }) {
    return (
        <td className={`px-4 py-3 text-gray-700 ${className}`}>
            {children}
        </td>
    );
}