import { useState, useEffect } from 'react';

const LoadingScreen = () => {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        "Initializing AI modules...",
        "Reading document structure...",
        "Extracting keywords & skills...",
        "Cross-referencing with JD...",
        "Generating optimization suggestions..."
    ];

    useEffect(() => {
        // Automatically progress through the simulated steps
        const timers = [];

        // Start at step 0 immediately
        timers.push(setTimeout(() => setCurrentStep(1), 1200));
        timers.push(setTimeout(() => setCurrentStep(2), 2800));
        timers.push(setTimeout(() => setCurrentStep(3), 4500));
        timers.push(setTimeout(() => setCurrentStep(4), 7500)); // evaluating (takes the longest)

        return () => timers.forEach(clearTimeout);
    }, []);

    const progress = Math.min(((currentStep + 1) / steps.length) * 100, 100);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl text-neutral-100">
            <div className="w-full max-w-sm mx-auto p-8 rounded-3xl bg-neutral-900/50 border border-white/10 shadow-2xl flex flex-col items-center relative overflow-hidden">
                
                {/* Background ambient glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>

                {/* Animated Logo / Icon */}
                <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-2xl border border-indigo-500/30 animate-[spin_4s_linear_infinite]"></div>
                    <div className="absolute inset-2 rounded-xl border border-purple-500/30 animate-[spin_3s_linear_infinite_reverse]"></div>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/40 flex items-center justify-center z-10 animate-pulse">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                </div>

                {/* Text content */}
                <div className="h-16 flex items-center justify-center mb-6 text-center z-10 w-full relative">
                    {steps.map((step, index) => (
                        <div 
                            key={index}
                            className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700
                                ${index === currentStep ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}
                            `}
                        >
                            <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                                {step}
                            </h3>
                            <p className="text-xs text-neutral-400 mt-2">Please wait while we analyze your resume</p>
                        </div>
                    ))}
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden z-10">
                    <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                
                {/* Step indicator */}
                <div className="mt-4 text-xs font-medium text-neutral-500 z-10 uppercase tracking-widest">
                    Step {currentStep + 1} of {steps.length}
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
