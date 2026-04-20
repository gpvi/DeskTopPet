import { useEffect, useRef } from 'react';
import lottie from 'lottie-web/build/player/lottie_light';

interface LottieLightPlayerProps {
  readonly animationData: unknown;
  readonly className?: string;
}

export default function LottieLightPlayer(props: LottieLightPlayerProps) {
  const { animationData, className } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const animation = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet',
      },
    });

    return () => {
      animation.destroy();
    };
  }, [animationData]);

  return <div className={className} ref={containerRef} />;
}

