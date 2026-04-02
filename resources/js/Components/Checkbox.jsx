export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-[rgb(var(--color-border))] bg-white text-[rgb(var(--color-primary))] shadow-sm focus:ring-[rgba(173,189,233,0.35)] ' +
                className
            }
        />
    );
}
