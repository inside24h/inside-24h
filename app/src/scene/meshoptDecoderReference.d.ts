// Types for the pure-JS meshopt reference decoder (copied from the meshoptimizer npm package, MIT).
export interface MeshoptDecoderLike {
  supported: boolean;
  ready: Promise<void>;
  decodeGltfBuffer(target: Uint8Array, count: number, size: number, source: Uint8Array, mode: string, filter?: string): void;
}
export declare const MeshoptDecoder: MeshoptDecoderLike;
