export default function Select({ children, ...props }) {
    return (
        <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
            {...props}
        >
            {children}
        </select>
    );
}