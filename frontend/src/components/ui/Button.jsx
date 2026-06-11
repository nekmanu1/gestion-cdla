export default function Button({ children, variant = 'primary', ...props }) {
    const variants = {
        primary: 'bg-neutral-950 text-white hover:bg-neutral-800',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        success: 'bg-green-600 text-white hover:bg-green-700',
        info: 'bg-blue-600 text-white hover:bg-blue-700'
    };

    return (
        <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${variants[variant]}`}
            {...props}
        >
            {children}
        </button>
    );
}