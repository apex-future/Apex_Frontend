import useAuthStore from '../../store/authStore';
import useGreeting from '../../hooks/useGreeting';
import Typewriter from '../ui/Typewriter';

export default function Header() {
    const { user } = useAuthStore();
    const firstName = user?.full_name?.split(' ')[0] || "User";
    const { greeting, talk } = useGreeting(firstName);

    return (
        <div className="w-full">
            <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pt-0 pb-2">
                <div className="welcome-message mb-4">
                    <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary mb-2 tracking-tightest leading-premium-tight min-h-[1.2em]">
                        <Typewriter text={greeting} speed={40} showCursor={false} />
                    </h1>
                    <p className="text-text-secondary font-medium tracking-tight min-h-[1.5em]">
                        <Typewriter text={talk} speed={30} delay={800} showCursor={false} />
                    </p>
                </div>
            </div>
        </div>
    )
}
