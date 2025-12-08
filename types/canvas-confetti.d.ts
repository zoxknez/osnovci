// Type declarations for canvas-confetti module

declare module "canvas-confetti" {
  interface Options {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    shapes?: ("square" | "circle" | "star")[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
    resize?: boolean;
    useWorker?: boolean;
  }

  interface GlobalOptions {
    resize?: boolean;
    useWorker?: boolean;
    disableForReducedMotion?: boolean;
  }

  interface CreateTypes {
    (options?: Options): Promise<null>;
    reset: () => void;
  }

  interface ConfettiFunction {
    (options?: Options): Promise<null> | null;
    reset: () => void;
    create: (
      canvas: HTMLCanvasElement | null,
      options?: GlobalOptions
    ) => CreateTypes;
  }

  const confetti: ConfettiFunction;
  export default confetti;
}
