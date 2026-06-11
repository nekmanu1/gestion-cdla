export default function Textarea(props) {
    return (
        <textarea
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-20 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
            {...props}
        />
    );
}