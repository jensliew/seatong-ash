import type { Seabin } from '../types';

/**
 * Demo / simulated stream scenarios — same values drive SimulatedStream + Seabin3D.
 * Derived from mock seabin fields so the story matches Quick Stats / cards.
 */
export type StreamScenario =
    | 'default'
    | 'ph_deadfish'
    | 'fish_haven'
    | 'heavy_pollution';

/**
 * Order matters: first matching rule wins.
 *
 * - fish_haven: Paused, clean water, no mortality (e.g. SB-003 — bycatch protection).
 * - heavy_pollution: Critical risk or extreme load (turbidity + capacity + debris).
 * - ph_deadfish: Acidic pH and/or repeated dead-fish signal without full overload.
 * - default: Typical active unit.
 */
export function streamScenarioForSeabin(seabin: Seabin): StreamScenario {
    const {
        status,
        contamination_risk,
        ph,
        turbidity,
        dead_fish_today,
        capacity,
        debris_intensity,
    } = seabin;

    if (
        status === 'paused' &&
        contamination_risk === 'low' &&
        dead_fish_today === 0
    ) {
        return 'fish_haven';
    }

    if (
        contamination_risk === 'critical' ||
        (debris_intensity >= 0.92 && capacity >= 82) ||
        (turbidity >= 88 && capacity >= 85)
    ) {
        return 'heavy_pollution';
    }

    if (ph < 6.95 || dead_fish_today >= 2) {
        return 'ph_deadfish';
    }

    return 'default';
}

export const SCENARIO_META: Record<
    StreamScenario,
    { title: string; subtitle: string }
> = {
    default: {
        title: 'Standard operation',
        subtitle: 'Typical debris load — pump and intake cycling normally.',
    },
    ph_deadfish: {
        title: 'Water chemistry stress',
        subtitle:
            'Low pH and/or elevated dead-fish observations — biological stress near the intake.',
    },
    fish_haven: {
        title: 'High marine life',
        subtitle:
            'Paused with clean readings — protecting fish before resuming collection.',
    },
    heavy_pollution: {
        title: 'Heavy debris & overflow risk',
        subtitle:
            'Critical load or very high turbidity — bin near capacity; surge debris expected.',
    },
};
