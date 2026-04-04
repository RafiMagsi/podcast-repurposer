const variantClasses = {
    default: 'app-card',
    soft: 'app-card-soft',
    compact: 'app-card-compact',
    muted: 'app-card-muted',
    panel: 'app-panel',
};

const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6 sm:p-8',
};

export default function AppCard({
    as: Component = 'div',
    variant = 'default',
    padding = 'none',
    className = '',
    children,
    ...props
}) {
    const classes = [variantClasses[variant] || variantClasses.default, paddingClasses[padding] || '', className]
        .filter(Boolean)
        .join(' ');

    return (
        <Component className={classes} {...props}>
            {children}
        </Component>
    );
}
