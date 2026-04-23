import { useEffect, useRef, useState } from 'react';
import logoSplash from '../assets/brand/SeaTong_Logo-transparent-1.png';

const SHOW_MS = 1600;
const FADE_MS = 500;

type SplashScreenProps = {
    onDone: () => void;
};

export default function SplashScreen({ onDone }: SplashScreenProps) {
    const [fading, setFading] = useState(false);
    const onDoneRef = useRef(onDone);

    useEffect(() => {
        onDoneRef.current = onDone;
    }, [onDone]);

    useEffect(() => {
        const t1 = window.setTimeout(() => setFading(true), SHOW_MS);
        const t2 = window.setTimeout(
            () => onDoneRef.current(),
            SHOW_MS + FADE_MS,
        );
        return () => {
            window.clearTimeout(t1);
            window.clearTimeout(t2);
        };
    }, []);

    return (
        <div
            className={`fixed inset-0 z-200 flex items-center justify-center bg-[#e8f4f8] transition-opacity duration-500 ease-out ${
                fading ? 'opacity-0' : 'opacity-100'
            }`}
            role='dialog'
            aria-label='Loading'
        >
            <img
                src={logoSplash}
                alt='SeaTong'
                className='max-h-[min(62vh,520px)] w-auto max-w-[min(94vw,720px)] object-contain select-none'
                draggable={false}
            />
        </div>
    );
}
