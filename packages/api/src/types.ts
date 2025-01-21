/**
 * A class meant to be implemented by the user which gives the engine
 * preprepared image data, for low-latency texture uploads.
 */
export abstract class ImageBitmapProvider {
    constructor(readonly width: number, readonly height: number) {}
    abstract getData(): ImageBitmap;
}

/** Element that can be used as an image in the engine. */
export type ImageLike = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmapProvider;

/** Type of a cached image, for performance and technical reasons. */
export const enum ImageType {
    Compressed,
    Image,
    Video,
    Canvas,
    ImageBitmapProvider,
}

/**
 * A type alias for any TypedArray constructor, except big-int arrays.
 */
export type TypedArrayCtor =
    | Int8ArrayConstructor
    | Uint8ArrayConstructor
    | Uint8ClampedArrayConstructor
    | Int16ArrayConstructor
    | Uint16ArrayConstructor
    | Int32ArrayConstructor
    | Uint32ArrayConstructor
    | Float32ArrayConstructor
    | Float64ArrayConstructor;

/**
 * Typed array instance based on a given {@link TypedArrayCtor} constructor.
 *
 * @typeParam T - The TypedArray constructor.
 */
export type TypedArray<T extends TypedArrayCtor = TypedArrayCtor> = InstanceType<T>;

/**
 * Represents any object that can be used as an array for read / write.
 */
export interface NumberArray {
    length: number;

    [n: number]: number;
}

/**
 * Type to describe a constructor.
 */
export type Constructor<T = any> = {
    new (...args: any[]): T;
};

export type FirstConstructorParam<T> = ConstructorParameters<Constructor<T>>[0];

/** Progress callback used when fetching data. */
export type ProgressCallback = (current: number, total: number) => void;