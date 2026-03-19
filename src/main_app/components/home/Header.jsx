import useAuthStore from '../../store/authStore';

export default function Header() {
    const { user } = useAuthStore();
    const firstName = user?.full_name?.split(' ')[0] || "User";

    return (
        <div className="w-full">
            <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pt-0 pb-2">
                <div className="welcome-message mb-4">
                    <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary mb-2 tracking-tightest leading-premium-tight">
                        Hey, {firstName}
                    </h1>
                    <p className="text-text-secondary font-medium tracking-tight">What's your pick today?</p>
                </div>
            </div>
        </div>
    )
}
