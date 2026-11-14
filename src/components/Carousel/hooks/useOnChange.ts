import { useRef, useLayoutEffect, useEffect } from "react"

// hooks/useOnChange.ts
export function useOnChange<T>(value: T, callback?: (value: T) => void) {
    const callbackRef = useRef(callback)
    useLayoutEffect(() => { callbackRef.current = callback })

    const previousRef = useRef(value)
    useEffect(() => {
        if (previousRef.current === value) return
        previousRef.current = value
        callbackRef.current?.(value)
    }, [value])
}