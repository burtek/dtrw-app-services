import { useState, useRef, useLayoutEffect } from 'react';


export const useMinDivWidth = <Element extends HTMLElement>() => {
    const [minWidth, setMinWidth] = useState<number>(0);
    const ref = useRef<Element>(null);

    useLayoutEffect(() => {
        if (!ref.current) {
            return undefined;
        }
        function onResize() {
            setMinWidth(min => Math.max(min, ref.current?.offsetWidth ?? 0));
        }
        const mutationObserver = new ResizeObserver(onResize);
        mutationObserver.observe(ref.current);
        ref.current.addEventListener('resize', onResize);
        window.setTimeout(onResize, 100); // Initial check
        const { current } = ref;
        return () => {
            current.removeEventListener('resize', onResize);
            mutationObserver.disconnect();
        };
    }, []);

    return { minWidth: `${minWidth}px`, ref };
};
