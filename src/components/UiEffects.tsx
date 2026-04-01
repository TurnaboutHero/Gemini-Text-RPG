import React from 'react';
import { UiEffect } from '../types';

interface UiEffectsProps {
    effects: UiEffect[];
    onEffectEnd: (id: string) => void;
}

const UiEffects: React.FC<UiEffectsProps> = ({ effects, onEffectEnd }) => {
    return (
        <>
            {effects.map(effect => {
                const targetElement = document.getElementById(effect.elementId);
                if (!targetElement) return null;
                const rect = targetElement.getBoundingClientRect();
                return (
                    <div
                        key={effect.id}
                        className={`absolute pointer-events-none animate-float-up font-bold text-2xl ${effect.color} drop-shadow-md z-50`}
                        style={{
                            left: `${rect.left + rect.width / 2}px`,
                            top: `${rect.top}px`,
                        }}
                        onAnimationEnd={() => onEffectEnd(effect.id)}
                    >
                        {effect.text}
                    </div>
                );
            })}
        </>
    );
};

export default UiEffects;
