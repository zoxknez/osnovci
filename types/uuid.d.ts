// Type declarations for uuid module

declare module "uuid" {
  export function v1(options?: {
    node?: number[];
    clockseq?: number;
    msecs?: number;
    nsecs?: number;
  }): string;

  export function v3(
    name: string | number[],
    namespace: string | number[]
  ): string;

  export function v4(options?: {
    random?: number[];
    rng?: () => number[];
  }): string;

  export function v5(
    name: string | number[],
    namespace: string | number[]
  ): string;

  export function parse(uuid: string): Uint8Array;
  export function stringify(arr: Uint8Array, offset?: number): string;
  export function validate(uuid: string): boolean;
  export function version(uuid: string): number;

  export const NIL: string;

  export namespace v3 {
    const DNS: string;
    const URL: string;
  }

  export namespace v5 {
    const DNS: string;
    const URL: string;
  }
}
