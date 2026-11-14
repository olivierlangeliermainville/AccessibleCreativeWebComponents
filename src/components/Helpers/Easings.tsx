type SpringOptions = {
    bounce?: number // 0 = no overshoot, 0.3 = subtle, 0.5 = clearly bouncy (default 0.3)
    settle?: number // how small the wobble must be by the end of the ease (default 0.002)
}

/**
 * A damped spring as an easing curve: progress 0..1 in, eased value out.
 * It starts gently, overshoots 1 by an amount set by `bounce`, and settles by t = 1.
 * Pass it to `releaseEasing` or `playPauseEasing`. Create it once, outside your component.
 */
export function spring({ bounce = 0.3, settle = 0.002 }: SpringOptions = {}) {
    // Damping ratio: 1 is critically damped (no overshoot), lower bounces more
    const damping = Math.min(Math.max(1 - bounce, 0.05), 1)

    // Pick the spring's speed so its wobble has shrunk to `settle` by t = 1
    let omega = -Math.log(settle) / damping
    if (damping === 1) {
        // Critically damped: solve (1 + omega) * e^-omega = settle by iterating
        for (let i = 0; i < 20; i++) omega = -Math.log(settle) + Math.log(1 + omega)
    }
    const dampedOmega = omega * Math.sqrt(1 - damping * damping)

    const raw = (t: number) => {
        const decay = Math.exp(-damping * omega * t)
        if (damping === 1) return 1 - decay * (1 + omega * t)
        return 1 - decay * (Math.cos(dampedOmega * t) + ((damping * omega) / dampedOmega) * Math.sin(dampedOmega * t))
    }

    // The spring ends a hair short of 1, so spread the leftover along the curve to hit 1 exactly
    const leftover = 1 - raw(1)

    return (t: number) => {
        const clamped = Math.min(Math.max(t, 0), 1)
        return raw(clamped) + leftover * clamped
    }
}