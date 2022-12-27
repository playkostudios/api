/**
 * Types
 */

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
export type Constructor<T> = {
    new (...args: any): T;
};

/**
 * Component constructor type.
 */
export type ComponentConstructor<T extends Component> = Constructor<T> & {
    TypeName: string;
    Properties: Record<string, CustomParameter>;
};

/**
 * Component prototype interface.
 *
 * User component's should have the same structure.
 */
export interface ComponentProto {
    /**
     * Triggered after the component instantiation.
     * For more information, please have a look at {@link Component.init}.
     */
    init?: () => void;
    /**
     * Triggered after the component is activated for the first time.
     * For more information, please have a look at {@link Component.start}.
     */
    start?: () => void;
    /**
     * Triggered once per frame.
     * For more information, please have a look at {@link Component.update}.
     *
     * @param dt Delta time, time since last update.
     */
    update?: (dt: number) => void;
    /**
     * Triggered when the component goes from deactivated to activated.
     * For more information, please have a look at {@link Component.onActivate}.
     */
    onActivate?: () => void;
    /**
     * Triggered when the component goes from activated to deactivated.
     * For more information, please have a look at {@link Component.onDeactivate}.
     */
    onDeactivate?: () => void;
    /**
     * Triggered when the component goes from activated to deactivated.
     * For more information, please have a look at {@link Component.onDestroy}.
     */
    onDestroy?: () => void;
}

/**
 * Callback triggered when the session starts.
 *
 * @param session The session that started
 */
export type XrSessionStartCallback = (session: XRSession) => void;

/**
 * Callback triggered for supported / unsupported session.
 *
 * @param type Type of session which is supported/not supported. Either `"vr"` or `"ar"`.
 * @param supported Whether given session type is supported.
 */
export type XrSupportCallback = (type: string, supported: boolean) => void;

/**
 * Callback triggered when the scene is loaded.
 */
export type SceneLoadedCallback = () => void;

export interface GLTFExtensions {
    root: Record<string, any>;
    mesh: Record<string, any>;
    node: Record<string, any>;
    idMapping: Record<string, any>;
}

/**
 * Result obtained when loading a scene.
 */
export type SceneAppendResult =
    | $Object
    | {
          root: $Object;
          extensions: Record<string, any>;
      };

/**
 * Callback triggered on collision event.
 *
 * @param type Type of the event.
 * @param other Other component that was (un)collided with
 */
export type CollisionCallback = (type: CollisionEventType, other: PhysXComponent) => void;

const MISALIGNED_MSG = 'Misaligned pointer: please report a bug';
/* Component class instances per type to avoid GC */
let ComponentCache: Record<string, Component[]> = {};
/* Object class instances per type to avoid GC */
let ObjectCache: $Object[] = [];
/* Component properties to exclude when cloning, see addComponent() */
const EXCLUDED_COMPONENT_PROPERTIES = ['_id', '_manager', 'type', '_type', 'active'];

/**
 * Wonderland Engine API
 * @namespace WL
 */

/**
 * Component parameter type enum
 */
export enum Type {
    /**
     * **Bool**:
     *
     * Appears in the editor as checkbox.
     */
    Bool = 1 << 1,

    /**
     * **Int**:
     *
     * Appears in the editor as int input field.
     */
    Int = 1 << 2,

    /**
     * **Float**:
     *
     * Appears in the editor as float input field.
     */
    Float = 1 << 3,

    /**
     * **String / Text**:
     *
     * Appears in the editor as text input field.
     */
    String = 1 << 4,

    /**
     * **Enumeration**:
     *
     * Appears in the editor as dropdown with given values.
     * If parameters is enum, a `values` parameter needs to be
     * specified for the parameter as well.
     *
     * @example
     *     camera: {type: Type.Enum, values: ['auto', 'back', 'front'], default: 'auto'},
     */
    Enum = 1 << 5,

    /**
     * **Object reference**:
     *
     * Appears in the editor as object resource selection dropdown
     * with object picker.
     */
    Object = 1 << 6,

    /**
     * **Mesh reference**:
     *
     * Appears in the editor as mesh resource selection dropdown.
     */
    Mesh = 1 << 7,

    /**
     * **Texture reference**:
     *
     * Appears in the editor as texture resource selection dropdown.
     */
    Texture = 1 << 8,

    /**
     * **Material reference**:
     *
     * Appears in the editor as material resource selection dropdown.
     */
    Material = 1 << 9,

    /**
     * **Animation reference**:
     *
     * Appears in the editor as animation resource selection dropdown.
     */
    Animation = 1 << 10,

    /**
     * **Skin reference**:
     *
     * Appears in the editor as skin resource selection dropdown.
     */
    Skin = 1 << 11,
}

/**
 * Default component parameter value per type.
 */
const _componentDefaults = new Array(6);
_componentDefaults[Type.Bool] = false;
_componentDefaults[Type.Int] = 0;
_componentDefaults[Type.Float] = 0.0;
_componentDefaults[Type.String] = '';
_componentDefaults[Type.Enum] = 0;
_componentDefaults[Type.Object] = null;
_componentDefaults[Type.Mesh] = null;
_componentDefaults[Type.Texture] = null;
_componentDefaults[Type.Material] = null;
_componentDefaults[Type.Animation] = null;
_componentDefaults[Type.Skin] = null;

/**
 * Custom component parameter.
 *
 * For more information about component properties, have a look
 * at the {@link Component.Properties} attribute.
 */
export interface CustomParameter {
    /** Parameter type. */
    type: Type;
    /** Default value, depending on type. */
    default: any;
    /** Values for {@link Type} */
    values: string[];
}

/**
 * Register a custom JavaScript component type.
 *
 * You can register a component directly using a class inheriting from {@link Component}:
 *
 * ```js
 * import { Component, Type } from '@wonderlandengine/api';
 * registerComponent(class MyComponent extends Component {
 *     static Properties = {
 *         myParam: {type: Type.Float, default: 42.0},
 *     };
 *     init: function() {},
 *     start: function() {},
 *     update: function(dt) {},
 *     onActivate: function() {},
 *     onDeactivate: function() {},
 *     onDestroy: function() {}
 * });
 * ```
 *
 * Or directly use an object literal as a prototype:
 *
 * ```js
 * registerComponent('my-new-type', {
 *    myParam: {type: Type.Float, default: 42.0},
 * }, {
 *    init: function() {},
 *    start: function() {},
 *    update: function(dt) {},
 *    onActivate: function() {},
 *    onDeactivate: function() {},
 *    onDestroy: function() {},
 * });
 * ```
 *
 * @param name Name of the component or a class extending {@link Component}.
 * @param params Dict of param names to {@link CustomParameter}.
 * @param object Object containing functions for the component type.
 */
function registerComponent<T extends Component>(
    name: string | ComponentConstructor<T>,
    params?: {[key: string]: CustomParameter},
    object?: ComponentProto
) {
    const typeIndex = _WL.registerComponent(name as string, params, object);
    const ctor = _WL._componentTypes[typeIndex] as ComponentConstructor<Component>;
    /* Set properties to the default value if needed. */
    for(const name in ctor.Properties) {
        const p = ctor.Properties[name];
        p.default = p.default || _componentDefaults[p.type];
        ctor.prototype[name] = p.default;
    }
}

/**
 * Collider type enum for {@link CollisionComponent}.
 */
export enum Collider {
    /**
     * **Sphere Collider**:
     *
     * Simplest and most performant collision shape. If this type is set on a
     * {@link CollisionComponent}, only the first component of
     * {@link CollisionComponent#extents} will be used to determine the radius.
     */
    Sphere = 0,

    /**
     * **Axis Aligned Bounding Box Collider**:
     *
     * Box that is always aligned to XYZ axis. It cannot be rotated but is more
     * efficient than {@link Collider.Box}.
     */
    AxisAlignedBox = 1,

    /**
     * **Aligned Bounding Box Collider**:
     *
     * Box that matches the object's rotation and translation correctly. This
     * is the least efficient collider and should only be chosen over
     * {@link Collider.Sphere} and {@link Collider.AxisAlignedBox} if really
     * necessary.
     */
    Box = 2,
}

/**
 * Alignment type enum for {@link TextComponent}.
 */
export enum Alignment {
    /** Text start is at object origin */
    Left = 1,

    /** Text center is at object origin */
    Center = 2,

    /** Text end is at object origin */
    Right = 3,
}

/**
 * Justification type enum for {@link TextComponent}.
 */
export enum Justification {
    /** Text line is at object origin */
    Line = 1,

    /** Text middle is at object origin */
    Middle = 2,

    /** Text top is at object origin */
    Top = 3,

    /** Text bottom is at object origin */
    Bottom = 4,
}

/**
 * Effect type enum for {@link TextComponent}.
 */
export enum TextEffect {
    /** Text is rendered normally */
    None = 0,

    /** Text is rendered with an outline */
    Outline = 1,
}

/**
 * Input type enum for {@link InputComponent}.
 */
export enum InputType {
    /** Head input */
    Head = 0,

    /** Left eye input */
    EyeLeft = 1,

    /** Right eye input */
    EyeRight = 2,

    /** Left controller input */
    ControllerLeft = 3,

    /** Right controller input */
    ControllerRight = 4,

    /** Left ray input */
    RayLeft = 5,

    /** Right ray input */
    RayRight = 6,
}

/**
 * Light type enum for {@link LightComponent}.
 */
export enum LightType {
    /** Point light */
    Point = 1,

    /** Spot light */
    Spot = 2,

    /** Sun light / Directional light */
    Sun = 3,
}

/**
 * Animation state of {@link AnimationComponent}.
 */
export enum AnimationState {
    /** Animation is currently playing */
    Playing = 1,

    /** Animation is paused and will continue at current playback
     * time on {@link AnimationComponent#play} */
    Paused = 2,

    /** Animation is stopped */
    Stopped = 3,
}

/**
 * Rigid body force mode for {@link PhysXComponent#addForce} and {@link PhysXComponent#addTorque}.
 *
 * [PhysX API Reference](https://gameworksdocs.nvidia.com/PhysX/4.1/documentation/physxapi/files/structPxForceMode.html)
 */
export enum ForceMode {
    /** Apply as force */
    Force = 0,

    /** Apply as impulse */
    Impulse = 1,

    /** Apply as velocity change, mass dependent */
    VelocityChange = 2,

    /** Apply as mass dependent force */
    Acceleration = 3,
}

/**
 * Collision callback event type.
 */
export enum CollisionEventType {
    /** Touch/contact detected, collision */
    Touch = 0,

    /** Touch/contact lost, uncollide */
    TouchLost = 1,

    /** Touch/contact with trigger detected */
    TriggerTouch = 2,

    /** Touch/contact with trigger lost */
    TriggerTouchLost = 3,
}

/**
 * Rigid body {@link PhysXComponent#shape}.
 *
 * [PhysX SDK Guide](https://gameworksdocs.nvidia.com/PhysX/4.1/documentation/physxguide/Manual/Geometry.html#geometry-types).
 */
export enum Shape {
    /** No shape. */
    None = 0,

    /** Sphere shape. */
    Sphere = 1,

    /** Capsule shape. */
    Capsule = 2,

    /** Box shape. */
    Box = 3,

    /** Plane shape. */
    Plane = 4,

    /** Convex mesh shape. */
    ConvexMesh = 5,

    /** Triangle mesh shape. */
    TriangleMesh = 6,
}

/**
 * Mesh attribute enum.
 * @since 0.9.0
 */
export enum MeshAttribute {
    /** Position attribute, 3 floats */
    Position = 0,

    /** Tangent attribute, 4 floats */
    Tangent = 1,

    /** Normal attribute, 3 floats */
    Normal = 2,

    /** Texture coordinate attribute, 2 floats */
    TextureCoordinate = 3,

    /** Color attribute, 4 floats, RGBA, range `0` to `1` */
    Color = 4,

    /** Joint id attribute, 4 unsigned ints */
    JointId = 5,

    /** Joint weights attribute, 4 floats */
    JointWeight = 6,

    /** Secondary joint id attribute, 4 unsigned ints */
    SecondaryJointId = 7,

    /** Secondary joint weights attribute, 4 floats */
    SecondaryJointWeight = 8,
}

/**
 * Material parameter type.
 */
export enum MaterialParamType {
    /** Unsigned integer parameter type. */
    UnsignedInt = 0,
    /** Integer parameter type. */
    Int = 1,
    /** Float parameter type. */
    Float = 2,
    /** Sampler resource parameter type, i.e., a {@link Texture}. */
    Sampler = 3,
    /**
     * Font resource parameter type.
     *
     * **Note**: Changing font isn't exposed yet and will raise an error.
     */
    Font = 4,
}

/**
 * Canvas element that Wonderland Engine renders to.
 */
let canvas: HTMLCanvasElement | null = null;

/**
 * Current WebXR session or {@link null} if no session active
 * @type {XRSession}
 */
let xrSession: XRSession | null = null;
/**
 * List of functions to call if a WebXR session is started
 */
const onXRSessionStart: XrSessionStartCallback[] = [
    (s) => {
        xrSession = s;
    },
];
/**
 * List of functions to call if a WebXR session ends
 */
const onXRSessionEnd: (() => void)[] = [
    () => {
        xrSession = null;
    },
];

/**
 * Whether AR is supported by the browser
 *
 * `undefined` until support could be determined
 */
let arSupported: boolean | undefined = undefined;
/**
 * Whether VR is supported by the browser
 *
 * `undefined` until support could be determined
 */
let vrSupported: boolean | undefined = undefined;

/**
 * List of functions to call once VR/AR support has been determined.
 *
 * Will be called once for AR and once for VR independent of support for each.
 * This allows you to notify the user of both cases: support and missing support of XR.
 * See the `supported` parameter of the callback, which indicates support.
 */
let onXRSupported: XrSupportCallback[] = [
    (type, supported) => {
        if (type == 'ar') arSupported = supported;
        if (type == 'vr') vrSupported = supported;
    },
];

/**
 * List of functions to call once the main scene has been loaded.
 */
let onSceneLoaded: SceneLoadedCallback[] = [];

/**
 * Current main scene
 * @type {Scene}
 */
let scene: Scene | undefined = undefined;
/**
 * Physics, only available when physx is enabled in the runtime
 * @type {Physics}
 */
let physics: Physics | undefined = undefined;

/**
 * Image cache.
 *
 * @hidden
 */
let _images: (HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | null)[] = [];

/**
 * List of callbacks triggered when the scene is loaded.
 *
 * @hidden
 */
let _sceneLoadedCallback: any[] = [];

let _tempMem: number = null!;
let _tempMemSize = 0;
let _tempMemFloat: Float32Array = null!;
let _tempMemInt: Int32Array = null!;
let _tempMemUint32: Uint32Array = null!;
let _tempMemUint16: Uint16Array = null!;
let _tempMemUint8: Uint8Array = null!;

/**
 * Initialize API resources, called by the engine automatically.
 *
 * @hidden
 */
function init() {
    scene = new Scene();
    /* For internal testing, we provide compatibility with DOM-less execution */
    canvas =
        typeof document === 'undefined'
            ? null
            : (document.getElementById('canvas') as HTMLCanvasElement);

    ComponentCache = {};
    /* Object class instances per type to avoid GC */
    ObjectCache = [];

    /* Target memory for JS API functions that return arrays */
    allocateTempMemory(1024);
}

/**
 * Reset the runtime state, including:
 *     - Component cache
 *     - Images
 *     - Callbacks
 *
 * **Note**: This is used internally.
 *
 * @hidden
 */
function reset() {
    ComponentCache = {};
    ObjectCache.length = 0;
    _images.length = 0;
    _sceneLoadedCallback.length = 0;
    _WL.reset();
}

/**
 * Initialize API resources, called by the engine automatically, if
 * PhysX is enabled.
 *
 * @hidden
 */
function _initPhysics() {
    physics = new Physics();
}

function allocateTempMemory(size: number) {
    console.log('Allocating temp mem:', size);
    _tempMemSize = size;
    if (_tempMem) _free(_tempMem);
    _tempMem = _malloc(_tempMemSize);
    updateTempMemory();
}

function requireTempMem(size: number) {
    if (_tempMemSize >= size) return;
    /* Grow in 1kb increments */
    allocateTempMemory(Math.ceil(size / 1024) * 1024);
}

function updateTempMemory() {
    _tempMemFloat = new Float32Array(HEAP8.buffer, _tempMem, _tempMemSize >> 2);
    _tempMemInt = new Int32Array(HEAP8.buffer, _tempMem, _tempMemSize >> 2);
    _tempMemUint32 = new Uint32Array(HEAP8.buffer, _tempMem, _tempMemSize >> 2);
    _tempMemUint16 = new Uint16Array(HEAP8.buffer, _tempMem, _tempMemSize >> 1);
    _tempMemUint8 = new Uint8Array(HEAP8.buffer, _tempMem, _tempMemSize);
}

/**
 * Returns a uint8 buffer view on temporary WASM memory.
 *
 * **Note**: this method might allocate if the requested memory is bigger
 * than the current temporary memory allocated.
 *
 * @param count The number of **elements** required
 * @returns A {@link TypedArray} over the WASM memory
 */
function getTempBufferU8(count: number): Uint8Array {
    requireTempMem(count);
    return _tempMemUint8;
}

/**
 * Returns a uint16 buffer view on temporary WASM memory.
 *
 * **Note**: this method might allocate if the requested memory is bigger
 * than the current temporary memory allocated.
 *
 * @param count The number of **elements** required
 * @returns A {@link TypedArray} over the WASM memory
 */
function getTempBufferU16(count: number): Uint16Array {
    requireTempMem(count * 2);
    return _tempMemUint16;
}

/**
 * Returns a uint32 buffer view on temporary WASM memory.
 *
 * **Note**: this method might allocate if the requested memory is bigger
 * than the current temporary memory allocated.
 *
 * @param count The number of **elements** required.
 * @returns A {@link TypedArray} over the WASM memory.
 */
function getTempBufferU32(count: number): Uint32Array {
    requireTempMem(count * 4);
    return _tempMemUint32;
}

/**
 * Returns a int32 buffer view on temporary WASM memory.
 *
 * **Note**: this method might allocate if the requested memory is bigger
 * than the current temporary memory allocated.
 *
 * @param count The number of **elements** required.
 * @returns A {@link TypedArray} over the WASM memory.
 */
function getTempBufferI32(count: number): Int32Array {
    requireTempMem(count * 4);
    return _tempMemInt;
}

/**
 * Returns a float32 buffer view on temporary WASM memory.
 *
 * **Note**: this method might allocate if the requested memory is bigger
 * than the current temporary memory allocated.
 *
 * @param {number} count The number of **elements** required.
 * @returns A {@link TypedArray} over the WASM memory.
 */
function getTempBufferF32(count: number): Float32Array {
    requireTempMem(count * 4);
    return _tempMemFloat;
}

export {
    registerComponent,
    canvas,
    scene,
    xrSession,
    onXRSessionStart,
    onXRSessionEnd,
    onXRSupported,
    onSceneLoaded,
    arSupported,
    vrSupported,
    physics,
    _images,
    _sceneLoadedCallback,
    textures,
    init,
    reset,
    _initPhysics,
    updateTempMemory,
};

/**
 * Constants.
 */

/**
 * Default world up vector.
 */
const UP_VECTOR = [0, 1, 0];

/**
 * Provides global scene functionality like raycasting.
 */
export class Scene {
    /** Called before rendering the scene */
    public onPreRender: (() => void)[];
    /** Called after the scene has been rendered */
    public onPostRender: (() => void)[];

    /** Ray hit pointer in WASM heap. @hidden */
    private _rayHit: number;
    /** Ray hit. @hidden */
    private _hit: RayHit;

    constructor() {
        this._rayHit = _malloc(4 * (3 * 4 + 3 * 4 + 4 + 2) + 4);
        this._hit = new RayHit(this._rayHit);

        /* Hidden property, list of functions to call after a
         * frame has been rendered */
        this.onPreRender = [];
        this.onPostRender = [];
    }

    /**
     * Currently active view components.
     */
    get activeViews(): ViewComponent[] {
        const count = _wl_scene_get_active_views(_tempMem, 16);

        const views: ViewComponent[] = [];
        const viewTypeIndex = $Object._typeIndexFor('view');
        for (let i = 0; i < count; ++i) {
            views.push(new ViewComponent(viewTypeIndex, _tempMemInt[i]));
        }

        return views;
    }

    /**
     * Cast a ray through the scene and find intersecting objects.
     *
     * The resulting ray hit will contain up to **4** closest ray hits,
     * sorted by increasing distance.
     *
     * @param o Ray origin.
     * @param d Ray direction.
     * @param group Collision group to filter by: only objects that are
     *        part of given group are considered for raycast.
     *
     * @returns The scene cached {@link RayHit} instance.
     * @note The returned object is owned by the Scene instance
     *   will be reused with the next {@link Scene#rayCast} call.
     */
    rayCast(o: number[], d: number[], group: number): RayHit {
        _wl_scene_ray_cast(o[0], o[1], o[2], d[0], d[1], d[2], group, this._rayHit);
        return this._hit;
    }

    /**
     * Add an object to the scene.
     *
     * @param parent Parent object or {@link null}.
     * @returns A newly created object.
     */
    addObject(parent: $Object | null): $Object {
        const parentId = parent ? parent.objectId : 0;
        const objectId = _wl_scene_add_object(parentId);
        return _wrapObject(objectId);
    }

    /**
     * Batch-add objects to the scene.
     *
     * Will provide better performance for adding multiple objects (e.g. > 16)
     * than calling {@link Scene#addObject} repeatedly in a loop.
     *
     * By providing upfront information of how many objects will be required,
     * the engine is able to batch-allocate the required memory rather than
     * convervatively grow the memory in small steps.
     *
     * **Experimental:** This API might change in upcoming versions.
     *
     * @param count Number of objects to add.
     * @param parent Parent object or {@link null}, default {@link null}.
     * @param componentCountHint Hint for how many components in total will
     *      be added to the created objects afterwards, default `0`.
     * @returns {$Object[]} newly created objects
     */
    addObjects(
        count: number,
        parent: $Object | null,
        componentCountHint: number
    ): $Object[] {
        const parentId = parent ? parent.objectId : 0;
        requireTempMem(count * 2);
        const actualCount = _wl_scene_add_objects(
            parentId,
            count,
            componentCountHint || 0,
            _tempMem,
            _tempMemSize >> 1
        );
        const ids = _tempMemUint16.subarray(0, actualCount);
        const objects = Array.from(ids, _wrapObject);
        return objects;
    }

    /**
     * Pre-allocate memory for a given amount of objects and components.
     *
     * Will provide better performance for adding objects later with {@link Scene#addObject}
     * and {@link Scene#addObjects}.
     *
     * By providing upfront information of how many objects will be required,
     * the engine is able to batch-allocate the required memory rather than
     * convervatively grow the memory in small steps.
     *
     * **Experimental:** This API might change in upcoming versions.
     *
     * @param objectCount Number of objects to add.
     * @param componentCountPerType Amount of components to
     *      allocate for {@link $Object.addComponent}, e.g. `{mesh: 100, collision: 200, "my-comp": 100}`.
     * @since 0.8.10
     */
    reserveObjects(objectCount: number, componentCountPerType: {[key: string]: number}) {
        componentCountPerType = componentCountPerType || {};
        const jsManagerIndex = $Object._typeIndexFor('js');
        let countsPerTypeIndex = _tempMemInt.subarray();
        countsPerTypeIndex.fill(0);
        for (const e of Object.entries(componentCountPerType)) {
            const typeIndex = $Object._typeIndexFor(e[0]);
            countsPerTypeIndex[typeIndex < 0 ? jsManagerIndex : typeIndex] += e[1];
        }
        _wl_scene_reserve_objects(objectCount, _tempMem);
    }

    /**
     * Set the background clear color.
     *
     * @param color new clear color (RGBA).
     * @since 0.8.5
     */
    set clearColor(color: number[]) {
        _wl_scene_set_clearColor(color[0], color[1], color[2], color[3]);
    }

    /**
     * Set whether to clear the color framebuffer before drawing.
     *
     * This function is useful if an external framework (e.g. an AR tracking
     * framework) is responsible for drawing a camera frame before Wonderland
     * Engine draws the scene on top of it.
     *
     * @param b Whether to enable color clear.
     * @since 0.9.4
     */
    set colorClearEnabled(b: boolean) {
        _wl_scene_enableColorClear(b);
    }

    /**
     * Load a scene file (.bin)
     *
     * Will replace the currently active scene with the one loaded
     * from given file. It is assumed that JavaScript components required by
     * the new scene were registered in advance.
     *
     * @param filename Path to the .bin file.
     */
    load(filename: string) {
        const strLen = lengthBytesUTF8(filename) + 1;
        const ptr = _malloc(strLen);
        stringToUTF8(filename, ptr, strLen);
        _wl_load_scene(ptr);
        _free(ptr);
    }

    /**
     * Load an external 3D file (.gltf, .glb).
     *
     * Loads and parses the gltf file and its images and appends the result
     * to scene.
     *
     * ```js
     * WL.scene.append(filename).then(root => {
     *     // root contains the loaded scene
     * });
     * ```
     *
     * In case the `loadGltfExtensions` option is set to true, the response
     * will be an object containing both the root of the loaded scene and
     * any glTF extensions found on nodes, meshes and the root of the file.
     *
     * ```js
     * WL.scene.append(filename, { loadGltfExtensions: true }).then(({root, extensions}) => {
     *     // root contains the loaded scene
     *     // extensions.root contains any extensions at the root of glTF document
     *     const rootExtensions = extensions.root;
     *     // extensions.mesh and extensions.node contain extensions indexed by Object id
     *     const childObject = root.children[0];
     *     const meshExtensions = root.meshExtensions[childObject.objectId];
     *     const nodeExtensions = root.nodeExtensions[childObject.objectId];
     *     // extensions.idMapping contains a mapping from glTF node index to Object id
     * });
     * ```
     *
     * @param filename Path to the .gltf or .glb file.
     * @param options Additional options for loading.
     * @returns Root of the loaded scene.
     */
    append(filename: string, options: Record<any, string>): Promise<SceneAppendResult> {
        options = options || {};
        const loadGltfExtensions = !!options.loadGltfExtensions;

        const strLen = lengthBytesUTF8(filename) + 1;
        const ptr = _malloc(strLen);
        stringToUTF8(filename, ptr, strLen);
        const callback = _sceneLoadedCallback.length;
        const promise = new Promise((resolve: (r: SceneAppendResult) => void, reject) => {
            _sceneLoadedCallback[callback] = {
                success: (id: number, extensions: Record<string, any>) => {
                    const root = _wrapObject(id);
                    resolve(extensions ? {root, extensions} : root);
                },
                error: () => reject(),
            };
        });

        _wl_append_scene(ptr, loadGltfExtensions, callback);
        _free(ptr);
        return promise;
    }

    /**
     * Unmarshalls the GltfExtensions from an Uint32Array.
     *
     * @param data Array containing the gltf extension data.
     * @returns The extensions stored in an object literal.
     *
     * @hidden
     */
    _unmarshallGltfExtensions(data: Uint32Array): GLTFExtensions {
        /* @todo: This method should be moved in the internal Emscripten library. */
        const extensions: GLTFExtensions = {
            root: {},
            mesh: {},
            node: {},
            idMapping: {},
        };

        let index = 0;
        const readString = () => {
            const strPtr = data[index++];
            const strLen = data[index++];
            return _WL.UTF8ViewToString(strPtr, strPtr + strLen);
        };

        const idMappingSize = data[index++];
        const idMapping = new Array(idMappingSize);
        for (let i = 0; i < idMappingSize; ++i) {
            idMapping[i] = data[index++];
        }
        extensions.idMapping = idMapping;

        const meshExtensionsSize = data[index++];
        for (let i = 0; i < meshExtensionsSize; ++i) {
            const objectId = data[index++];
            extensions.mesh[idMapping[objectId]] = JSON.parse(readString());
        }
        const nodeExtensionsSize = data[index++];
        for (let i = 0; i < nodeExtensionsSize; ++i) {
            const objectId = data[index++];
            extensions.node[idMapping[objectId]] = JSON.parse(readString());
        }
        const rootExtensionsStr = readString();
        if (rootExtensionsStr) {
            extensions.root = JSON.parse(rootExtensionsStr);
        }

        return extensions;
    }

    /**
     * Reset the scene.
     *
     * This method deletes all used and allocated objects, and components.
     */
    reset() {
        _wl_scene_reset();
    }
}

/**
 * Native component
 *
 * Provides access to a native component instance of a specified component type.
 *
 * Usage example:
 *
 * ```js
 * import { Component, Type } from '@wonderlandengine/api';
 *
 * class MyComponent extends Component {
 *     static TypeName = 'my-component';
 *     static Properties = {
 *         myBoolean: { type: Type.Boolean, default: false },
 *     };
 *     start() {}
 *     onActivate() {}
 *     onDeactivate() {}
 *     update(dt) {}
 * }
 * ```
 */
export class Component {
    /**
     * Unique identifier for this component class.
     *
     * This is used to register, add, and retrieve component of a given type.
     */
    public static TypeName: string;

    /**
     * Properties of this component class.
     *
     * Properties are public attributes that can be configured via the
     * Wonderland Editor.
     *
     * Example:
     *
     * ```js
     * import { Component, Type } from '@wonderlandengine/api';
     * class MyComponent extends Component {
     *     static TypeName = 'my-component';
     *     static Properties = {
     *         myBoolean: { type: Type.Boolean, default: false },
     *         myFloat: { type: Type.Float, default: false },
     *         myTexture: { type: Type.Texture, default: null },
     *     };
     * }
     * ```
     *
     * Properties are automatically added to each component instance, and are
     * accessible like any JS attribute:
     *
     * ```js
     * // Creates a new component and set each properties value:
     * const myComponent = object.addComponent(MyComponent, {
     *     myBoolean: true,
     *     myFloat: 42.0,
     *     myTexture: null
     * });
     *
     * // You can also override the properties on the instance:
     * myComponent.myBoolean = false;
     * myComponent.myFloat = -42.0;
     * ```
     */
    public static Properties: Record<string, CustomParameter>;

    /**
     * Triggered when the component is initialized by the runtime. This method
     * will only be triggered **once** after instantiation.
     */
    public init?(): void;

    /**
     * Triggered when the component is started by the runtime, or activated.
     *
     * You can use that to re-initialize the state of the component.
     */
    public start?(): void;

    /**
     * Triggered  **every frame** by the runtime.
     *
     * You should perform your business logic in this method. Example:
     *
     * ```js
     * import { Component, Type } from '@wonderlandengine/api';
     *
     * class TranslateForwardComponent extends Component {
     *     static TypeName = 'translate-forward-component';
     *     static Properties = {
     *         speed: { type: Type.Float, default: 1.0 }
     *     };
     *     constructor() {
     *         this._forward = new Float32Array([0, 0, 0]);
     *     }
     *     update(dt) {
     *         this.object.getForward(this._forward);
     *         this._forward[0] *= this.speed;
     *         this._forward[1] *= this.speed;
     *         this._forward[2] *= this.speed;
     *         this.object.translate(this._forward);
     *     }
     * }
     * ```
     *
     * @param delta Elapsed time between this frame and the previous one, in **seconds**.
     */
    public update?(delta: number): void;

    /**
     * Triggered when the component goes from an inactive state to an active state.
     *
     * @note You can manually activate or deactivate a component using: {@link Component.activate}.
     */
    public onActivate?(): void;

    /**
     * Triggered when the component goes from an activated state to an inactive state.
     *
     * @note You can manually activate or deactivate a component using: {@link Component.activate}.
     */
    public onDeactivate?(): void;

    /** Manager index. @hidden */
    protected readonly _manager: number;
    /** Instance index. @hidden */
    protected readonly _id: number;

    /**
     * Object containing this object.
     *
     * **Note**: This is cached for faster retrieval.
     *
     * @hidden
     */
    private _object: $Object | null;

    /**
     * Component's typename, e.g., 'my-component'.
     *
     * @todo: Should be deprecated. Constructor should be looked up instead.
     *
     * @hidden
     */
    private _type: string | null;

    /**
     * Create a new instance
     *
     * @param managerIndex Index of the manager.
     * @param id WASM component instance index.
     *
     * @hidden
     */
    constructor(managerIndex: number = -1, id: number = -1) {
        this._manager = managerIndex;
        this._id = id;
        this._object = null;
        this._type = null;
    }

    /** The name of this component's type */
    get type(): string {
        return this._type || $Object._typeNameFor(this._manager);
    }

    /** The object this component is attached to. */
    get object(): $Object {
        if (!this._object) {
            const objectId = _wl_component_get_object(this._manager, this._id);
            this._object = _wrapObject(objectId);
        }
        return this._object;
    }

    /**
     * Set whether this component is active.
     *
     * Activating/deactivating a component comes at a small cost of reordering
     * components in the respective component manager. This function therefore
     * is not a trivial assignment.
     *
     * Does nothing if the component is already activated/deactivated.
     *
     * @param active New active state.
     */
    set active(active: boolean) {
        _wl_component_setActive(this._manager, this._id, active);
    }

    /**
     * Whether this component is active
     */
    get active(): boolean {
        return _wl_component_isActive(this._manager, this._id) != 0;
    }

    /**
     * Remove this component from its objects and destroy it.
     *
     * It is best practice to set the component to `null` after,
     * to ensure it does not get used later.
     *
     * ```js
     *    c.destroy();
     *    c = null;
     * ```
     * @since 0.9.0
     */
    destroy(): void {
        _wl_component_remove(this._manager, this._id);

        /* @todo: shouldn't be set to undefined. */
        // @ts-ignore
        this._manager = undefined;
        // @ts-ignore
        this._id = undefined;
    }

    /**
     * Checks equality by comparing whether the wrapped native component ids
     * and component manager types are equal.
     *
     * @param otherComponent Component to check equality with.
     * @returns Whether this component equals the given component.
     */
    equals(otherComponent: Component | undefined | null): boolean {
        if (!otherComponent) return false;
        return this._manager == otherComponent._manager && this._id == otherComponent._id;
    }
}

/**
 * Native collision component.
 *
 * Provides access to a native collision component instance.
 */
export class CollisionComponent extends Component {
    /** Collision component collider */
    get collider(): Collider {
        return _wl_collision_component_get_collider(this._id);
    }

    /**
     * Set collision component collider.
     *
     * @param collider Collider of the collision component.
     */
    set collider(collider: Collider) {
        _wl_collision_component_set_collider(this._id, collider);
    }

    /**
     * Collision component extents.
     *
     * If {@link collider} returns {@link Collider.Sphere}, only the first
     * component of the returned vector is used.
     */
    get extents(): Float32Array {
        return new Float32Array(
            HEAPF32.buffer,
            _wl_collision_component_get_extents(this._id),
            3
        );
    }

    /**
     * Set collision component extents.
     *
     * If {@link collider} returns {@link Collider.Sphere}, only the first
     * component of the passed vector is used.
     *
     * Example:
     *
     * ```js
     * // Spans 1 unit on the x-axis, 2 on the y-axis, 3 on the z-axis.
     * collision.extent = [1, 2, 3];
     * ```
     *
     * @param extents Extents of the collision component, expects a
     *      3 component array.
     */
    set extents(extents: Readonly<NumberArray>) {
        this.extents.set(extents);
    }

    /**
     * Collision component group.
     *
     * The groups is a bitmask that is compared to other components in {@link CollisionComponent#queryOverlaps}
     * or the group in {@link Scene#rayCast}.
     *
     * Colliders that have no common groups will not overlap with each other. If a collider
     * has none of the groups set for {@link Scene#rayCast}, the ray will not hit it.
     *
     * Each bit represents belonging to a group, see example.
     *
     * ```js
     *    // c belongs to group 2
     *    c.group = (1 << 2);
     *
     *    // c belongs to group 0
     *    c.group = (1 << 0);
     *
     *    // c belongs to group 0 *and* 2
     *    c.group = (1 << 0) | (1 << 2);
     *
     *    (c.group & (1 << 2)) != 0; // true
     *    (c.group & (1 << 7)) != 0; // false
     * ```
     */
    get group(): number {
        return _wl_collision_component_get_group(this._id);
    }

    /**
     * Set collision component group.
     *
     * @param group Group mask of the collision component.
     */
    set group(group: number) {
        _wl_collision_component_set_group(this._id, group);
    }

    /**
     * Query overlapping objects.
     *
     * Usage:
     *
     * ```js
     * const collision = object.getComponent('collision');
     * const overlaps = collision.queryOverlaps();
     * for(const otherCollision of overlaps) {
     *     const otherObject = otherCollision.object;
     *     console.log(`Collision with object ${otherObject.objectId}`);
     * }
     * ```
     *
     * @returns Collision components overlapping this collider.
     */
    queryOverlaps(): CollisionComponent[] {
        const count = _wl_collision_component_query_overlaps(
            this._id,
            _tempMem,
            _tempMemSize >> 1
        );
        let overlaps = new Array(count);
        for (let i = 0; i < count; ++i) {
            overlaps[i] = new CollisionComponent(this._manager, _tempMemUint16[i]);
        }
        return overlaps;
    }
}

/**
 * Native text component
 *
 * Provides access to a native text component instance
 */
export class TextComponent extends Component {
    /** Text component alignment. */
    get alignment(): Alignment {
        return _wl_text_component_get_horizontal_alignment(this._id);
    }

    /**
     * Set text component alignment.
     *
     * @param alignment Alignment for the text component.
     */
    set alignment(alignment: Alignment) {
        _wl_text_component_set_horizontal_alignment(this._id, alignment);
    }

    /** Text component justification. */
    get justification(): Justification {
        return _wl_text_component_get_vertical_alignment(this._id);
    }

    /**
     * Set text component justification.
     *
     * @param justification Justification for the text component.
     */
    set justification(justification: Justification) {
        _wl_text_component_set_vertical_alignment(this._id, justification);
    }

    /** Text component character spacing. */
    get characterSpacing(): number {
        return _wl_text_component_get_character_spacing(this._id);
    }

    /**
     * Set text component character spacing.
     *
     * @param spacing Character spacing for the text component.
     */
    set characterSpacing(spacing) {
        _wl_text_component_set_character_spacing(this._id, spacing);
    }

    /** Text component line spacing. */
    get lineSpacing(): number {
        return _wl_text_component_get_line_spacing(this._id);
    }

    /**
     * Set text component line spacing
     *
     * @param spacing Line spacing for the text component
     */
    set lineSpacing(spacing: number) {
        _wl_text_component_set_line_spacing(this._id, spacing);
    }

    /** Text component effect. */
    get effect(): TextEffect {
        return _wl_text_component_get_effect(this._id);
    }

    /**
     * Set text component effect
     *
     * @param effect Effect for the text component
     */
    set effect(effect: TextEffect) {
        _wl_text_component_set_effect(this._id, effect);
    }

    /** Text component text. */
    get text(): string {
        return UTF8ToString(_wl_text_component_get_text(this._id));
    }

    /**
     * Set text component text.
     *
     * @param text Text of the text component.
     */
    set text(text: string) {
        const strLen = lengthBytesUTF8(text) + 1;
        const ptr = _malloc(strLen);
        stringToUTF8(text, ptr, strLen);
        _wl_text_component_set_text(this._id, ptr);
        _free(ptr);
    }

    /**
     * Set material to render the text with.
     *
     * @param material New material.
     */
    set material(material: Material | null | undefined) {
        const matIndex = material ? material._index : 0;
        _wl_text_component_set_material(this._id, matIndex);
    }

    /** Material used to render the text. */
    get material(): Material | null {
        const id = _wl_text_component_get_material(this._id);
        return id > 0 ? new Material(id) : null;
    }
}

/**
 * Native view component.
 *
 * Provides access to a native view component instance.
 */
export class ViewComponent extends Component {
    /** Projection matrix. */
    get projectionMatrix(): Float32Array {
        return new Float32Array(
            HEAPF32.buffer,
            _wl_view_component_get_projection_matrix(this._id),
            16
        );
    }

    /** ViewComponent near clipping plane value. */
    get near(): number {
        return _wl_view_component_get_near(this._id);
    }

    /**
     * Set near clipping plane distance for the view.
     *
     * If an XR session is active, the change will apply in the
     * following frame, otherwise the change is immediate.
     *
     * @param near Near depth value.
     */
    set near(near: number) {
        _wl_view_component_set_near(this._id, near);
    }

    /** Far clipping plane value. */
    get far(): number {
        return _wl_view_component_get_far(this._id);
    }

    /**
     * Set far clipping plane distance for the view.
     *
     * If an XR session is active, the change will apply in the
     * following frame, otherwise the change is immediate.
     *
     * @param far Near depth value.
     */
    set far(far: number) {
        _wl_view_component_set_far(this._id, far);
    }

    /**
     * Get the horizontal field of view for the view, **in degrees**.
     *
     * If an XR session is active, this returns the field of view reported by
     * the device, regardless of the fov that was set.
     */
    get fov(): number {
        return _wl_view_component_get_fov(this._id);
    }

    /**
     * Set the horizontal field of view for the view, **in degrees**.
     *
     * If an XR session is active, the field of view reported by the device is
     * used and this value is ignored. After the XR session ends, the new value
     * is applied.
     *
     * @param fov Horizontal field of view, **in degrees**.
     */
    set fov(fov) {
        _wl_view_component_set_fov(this._id, fov);
    }
}

/**
 * Native input component.
 *
 * Provides access to a native input component instance.
 */
export class InputComponent extends Component {
    /** Input component type */
    get inputType(): InputType {
        return _wl_input_component_get_type(this._id);
    }

    /**
     * Set input component type.
     *
     * @params New input component type.
     */
    set inputType(type: InputType) {
        _wl_input_component_set_type(this._id, type);
    }

    /**
     * WebXR Device API input source associated with this input component,
     * if type {@link InputType.ControllerLeft} or {@link InputType.ControllerRight}.
     */
    get xrInputSource(): XRInputSource | null {
        if (xrSession) {
            for (let inputSource of xrSession.inputSources) {
                if (inputSource.handedness == this.handedness) {
                    return inputSource;
                }
            }
        }

        return null;
    }

    /**
     * 'left', 'right' or {@link null} depending on the {@link InputComponent#inputType}.
     */
    get handedness(): 'left' | 'right' | null {
        const inputType = this.inputType;
        if (
            inputType == InputType.ControllerRight ||
            inputType == InputType.RayRight ||
            inputType == InputType.EyeRight
        )
            return 'right';
        if (
            inputType == InputType.ControllerLeft ||
            inputType == InputType.RayLeft ||
            inputType == InputType.EyeLeft
        )
            return 'left';

        return null;
    }
}

/**
 * Native light component.
 *
 * Provides access to a native light component instance.
 */
export class LightComponent extends Component {
    /** View on the light color */
    get color(): Float32Array {
        return new Float32Array(HEAPF32.buffer, _wl_light_component_get_color(this._id), 4);
    }

    /** Light type. */
    get lightType(): LightType {
        return _wl_light_component_get_type(this._id);
    }

    /**
     * Set light type.
     *
     * @param lightType Type of the light component.
     */
    set lightType(t: LightType) {
        _wl_light_component_set_type(this._id, t);
    }
}

/**
 * Native animation component.
 *
 * Provides access to a native animation component instance.
 */
export class AnimationComponent extends Component {
    /**
     * Set animation to play.
     *
     * Make sure to {@link Animation#retarget} the animation to affect the
     * right objects.
     *
     * @param anim Animation to play.
     */
    set animation(anim: Animation) {
        _wl_animation_component_set_animation(this._id, anim._index);
    }

    /** Animation set for this component */
    get animation(): Animation {
        return new Animation(_wl_animation_component_get_animation(this._id));
    }

    /**
     * Set play count. Set to `0` to loop indefinitely.
     *
     * @param playCount Number of times to repeat the animation.
     */
    set playCount(playCount: number) {
        _wl_animation_component_set_playCount(this._id, playCount);
    }

    /** Number of times the animation is played. */
    get playCount(): number {
        return _wl_animation_component_get_playCount(this._id);
    }

    /**
     * Set speed. Set to negative values to run the animation backwards.
     *
     * Setting speed has an immediate effect for the current frame's update
     * and will continue with the speed from the current point in the animation.
     *
     * @param speed New speed at which to play the animation.
     * @since 0.8.10
     */
    set speed(speed: number) {
        _wl_animation_component_set_speed(this._id, speed);
    }

    /**
     * Speed factor at which the animation is played.
     *
     * @since 0.8.10
     */
    get speed(): number {
        return _wl_animation_component_get_speed(this._id);
    }

    /** Current playing state of the animation */
    get state(): AnimationState {
        return _wl_animation_component_state(this._id);
    }

    /** Play animation. */
    play(): void {
        _wl_animation_component_play(this._id);
    }

    /** Stop animation. */
    stop(): void {
        _wl_animation_component_stop(this._id);
    }

    /** Pause animation. */
    pause(): void {
        _wl_animation_component_pause(this._id);
    }
}

/**
 * Native mesh component.
 *
 * Provides access to a native mesh component instance.
 */
export class MeshComponent extends Component {
    /**
     * Set material to render the mesh with.
     *
     * @param material Material to render the mesh with.
     */
    set material(material: Material | null | undefined) {
        _wl_mesh_component_set_material(this._id, material ? material._index : 0);
    }

    /** Material used to render the mesh. */
    get material(): Material | null {
        const id = _wl_mesh_component_get_material(this._id);
        return id > 0 ? new Material(id) : null;
    }

    /** Mesh rendered by this component. */
    get mesh(): Mesh {
        return new Mesh(_wl_mesh_component_get_mesh(this._id));
    }

    /**
     * Set mesh to rendered with this component.
     *
     * @param mesh Mesh rendered by this component.
     */
    set mesh(mesh: Mesh | null | undefined) {
        _wl_mesh_component_set_mesh(this._id, mesh ? mesh._index : 0);
    }

    /** Skin for this mesh component. */
    get skin(): Skin {
        return new Skin(_wl_mesh_component_get_skin(this._id));
    }

    /**
     * Set skin to transform this mesh component.
     *
     * @param {?Skin} skin Skin to use for rendering skinned meshes.
     */
    set skin(skin) {
        _wl_mesh_component_set_skin(this._id, skin._index);
    }
}

/**
 * Native physx rigid body component.
 *
 * Provides access to a native mesh component instance.
 * Only available when using physx enabled runtime, see "Project Settings > Runtime".
 */
class PhysXComponent extends Component {
    /**
     * Set whether this rigid body is static.
     *
     * Setting this property only takes effect once the component
     * switches from inactive to active.
     *
     * @param b Whether the rigid body should be static.
     */
    set static(b: boolean) {
        _wl_physx_component_set_static(this._id, b);
    }

    /**
     * Whether this rigid body is static.
     *
     * This property returns whether the rigid body is *effectively*
     * static. If static property was set while the rigid body was
     * active, it will not take effect until the rigid body is set
     * inactive and active again. Until the component is set inactive,
     * this getter will return whether the rigidbody is actually
     * static.
     */
    get static(): boolean {
        return !!_wl_physx_component_get_static(this._id);
    }

    /**
     * Set whether this rigid body is kinematic.
     *
     * @param b Whether the rigid body should be kinematic.
     */
    set kinematic(b: boolean) {
        _wl_physx_component_set_kinematic(this._id, b);
    }

    /**
     * Whether this rigid body is kinematic.
     */
    get kinematic(): boolean {
        return !!_wl_physx_component_get_kinematic(this._id);
    }

    /**
     * Set the shape for collision detection.
     *
     * @param s New shape.
     * @since 0.8.5
     */
    set shape(s: Shape) {
        _wl_physx_component_set_shape(this._id, s);
    }

    /** The shape for collision detection. */
    get shape(): Shape {
        return _wl_physx_component_get_shape(this._id);
    }

    /**
     * Set additional data for the shape.
     *
     * Retrieved only from {@link PhysXComponent#shapeData}.
     * @since 0.8.10
     */
    set shapeData(d) {
        /* @todo: The array includes is useless and slow. */
        if (d == null || ![Shape.TriangleMesh, Shape.ConvexMesh].includes(this.shape))
            return;
        _wl_physx_component_set_shape_data(this._id, d.index);
    }

    /**
     * Additional data for the shape.
     *
     * `null` for {@link Shape} values: `None`, `Sphere`, `Capsule`, `Box`, `Plane`.
     * `{index: n}` for `TriangleMesh` and `ConvexHull`.
     *
     * This data is currently only for passing onto or creating other {@link PhysXComponent}.
     * @since 0.8.10
     */
    get shapeData(): {index: number} | null {
        if (![Shape.TriangleMesh, Shape.ConvexMesh].includes(this.shape)) return null;
        return {index: _wl_physx_component_get_shape_data(this._id)};
    }

    /**
     * Set the shape extents for collision detection.
     *
     * @param e New extents for the shape.
     * @since 0.8.5
     */
    set extents(e: Readonly<NumberArray>) {
        this.extents.set(e);
    }

    /**
     * The shape extents for collision detection.
     */
    get extents(): Float32Array {
        const ptr = _wl_physx_component_get_extents(this._id);
        return new Float32Array(HEAPF32.buffer, ptr, 3);
    }

    /**
     * Get staticFriction.
     */
    get staticFriction(): number {
        return _wl_physx_component_get_staticFriction(this._id);
    }

    /**
     * Set staticFriction.
     * @param v New staticFriction.
     */
    set staticFriction(v: number) {
        _wl_physx_component_set_staticFriction(this._id, v);
    }

    /**
     * Get dynamicFriction.
     */
    get dynamicFriction(): number {
        return _wl_physx_component_get_dynamicFriction(this._id);
    }

    /**
     * Set dynamicFriction
     * @param v New dynamicDamping.
     */
    set dynamicFriction(v: number) {
        _wl_physx_component_set_dynamicFriction(this._id, v);
    }

    /**
     * Get bounciness.
     * @since 0.9.0
     */
    get bounciness(): number {
        return _wl_physx_component_get_bounciness(this._id);
    }

    /**
     * Set bounciness.
     * @param v New bounciness.
     * @since 0.9.0
     */
    set bounciness(v: number) {
        _wl_physx_component_set_bounciness(this._id, v);
    }

    /**
     * Get linearDamping/
     */
    get linearDamping(): number {
        return _wl_physx_component_get_linearDamping(this._id);
    }

    /**
     * Set linearDamping.
     * @param v New linearDamping.
     */
    set linearDamping(v: number) {
        _wl_physx_component_set_linearDamping(this._id, v);
    }

    /** Get angularDamping. */
    get angularDamping(): number {
        return _wl_physx_component_get_angularDamping(this._id);
    }

    /**
     * Set angularDamping.
     * @param v New angularDamping.
     */
    set angularDamping(v: number) {
        _wl_physx_component_set_angularDamping(this._id, v);
    }

    /**
     * Set linear velocity.
     *
     * [PhysX Manual - "Velocity"](https://gameworksdocs.nvidia.com/PhysX/4.1/documentation/physxguide/Manual/RigidBodyDynamics.html#velocity)
     *
     * Has no effect, if the component is not active.
     *
     * @param v New linear velocity.
     */
    set linearVelocity(v: Readonly<NumberArray>) {
        _wl_physx_component_set_linearVelocity(this._id, v[0], v[1], v[2]);
    }

    /** Linear velocity or `[0, 0, 0]` if the component is not active. */
    get linearVelocity(): Float32Array {
        _wl_physx_component_get_linearVelocity(this._id, _tempMem);
        return new Float32Array(HEAPF32.buffer, _tempMem, 3);
    }

    /**
     * Set angular velocity
     *
     * [PhysX Manual - "Velocity"](https://gameworksdocs.nvidia.com/PhysX/4.1/documentation/physxguide/Manual/RigidBodyDynamics.html#velocity)
     *
     * Has no effect, if the component is not active.
     *
     * @param v New angular velocity
     */
    set angularVelocity(v: Readonly<NumberArray>) {
        _wl_physx_component_set_angularVelocity(this._id, v[0], v[1], v[2]);
    }

    /** Angular velocity or `[0, 0, 0]` if the component is not active. */
    get angularVelocity(): Float32Array {
        _wl_physx_component_get_angularVelocity(this._id, _tempMem);
        return new Float32Array(HEAPF32.buffer, _tempMem, 3);
    }

    /**
     * Set mass.
     *
     * [PhysX Manual - "Mass Properties"](https://gameworksdocs.nvidia.com/PhysX/4.1/documentation/physxguide/Manual/RigidBodyDynamics.html#mass-properties)
     *
     * @param m New mass.
     */
    set mass(m: number) {
        _wl_physx_component_set_mass(this._id, m);
    }

    /** Mass */
    get mass(): number {
        return _wl_physx_component_get_mass(this._id);
    }

    /**
     * Set mass space interia tensor.
     *
     * [PhysX Manual - "Mass Properties"](https://gameworksdocs.nvidia.com/PhysX/4.1/documentation/physxguide/Manual/RigidBodyDynamics.html#mass-properties)
     *
     * Has no effect, if the component is not active.
     *
     * @param v New mass space interatia tensor.
     */
    set massSpaceInteriaTensor(v: Readonly<NumberArray>) {
        _wl_physx_component_set_massSpaceInertiaTensor(this._id, v[0], v[1], v[2]);
    }

    /**
     * Apply a force.
     *
     * [PhysX Manual - "Applying Forces and Torques"](https://gameworksdocs.nvidia.com/PhysX/4.1/documentation/physxguide/Manual/RigidBodyDynamics.html#applying-forces-and-torques)
     *
     * Has no effect, if the component is not active.
     *
     * @param f Force vector.
     * @param m Force mode, see {@link ForceMode}, default `Force`.
     * @param localForce Whether the force vector is in local space, default `false`.
     * @param p Position to apply force at, default is center of mass.
     * @param local Whether position is in local space, default `false`.
     */
    addForce(
        f: Readonly<NumberArray>,
        m?: ForceMode,
        localForce?: boolean,
        p?: Readonly<NumberArray>,
        local?: boolean
    ) {
        /* @todo: `localForce` should be a boolean`. */
        m = m || ForceMode.Force;
        if (!p) {
            _wl_physx_component_addForce(this._id, f[0], f[1], f[2], m, !!localForce);
        } else {
            _wl_physx_component_addForceAt(
                this._id,
                f[0],
                f[1],
                f[2],
                m,
                !!localForce,
                p[0],
                p[1],
                p[2],
                !!local
            );
        }
    }

    /**
     * Apply torque.
     *
     * [PhysX Manual - "Applying Forces and Torques"](https://gameworksdocs.nvidia.com/PhysX/4.1/documentation/physxguide/Manual/RigidBodyDynamics.html#applying-forces-and-torques)
     *
     * Has no effect, if the component is not active.
     *
     * @param f Force vector.
     * @param m Force mode, see {@link ForceMode}, default `Force`.
     */
    addTorque(f: Readonly<NumberArray>, m: ForceMode = ForceMode.Force) {
        _wl_physx_component_addTorque(this._id, f[0], f[1], f[2], m);
    }

    /**
     * Add on collision callback.
     *
     * @param callback Function to call when this rigid body (un)collides with any other.
     *
     * ```js
     *  let rigidBody = this.object.getComponent('physx');
     *  rigidBody.onCollision(function(type, other) {
     *      // Ignore uncollides
     *      if(type == CollisionEventType.TouchLost) return;
     *
     *      // Take damage on collision with enemies
     *      if(other.object.name.startsWith('enemy-')) {
     *          this.applyDamage(10);
     *      }
     *  }.bind(this));
     * ```
     *
     * @returns Id of the new callback for use with {@link PhysXComponent#removeCollisionCallback}.
     */
    onCollision(callback: CollisionCallback): number {
        return this.onCollisionWith(this, callback);
    }

    /**
     * Add filtered on collision callback.
     *
     * @param otherComp Component for which callbacks will
     *        be triggered. If you pass this component, the method is equivalent to.
     *        {@link PhysXComponent#onCollision}.
     * @param callback Function to call when this rigid body
     *        (un)collides with `otherComp`.
     * @returns Id of the new callback for use with {@link PhysXComponent#removeCollisionCallback}.
     */
    onCollisionWith(otherComp: this, callback: CollisionCallback): number {
        physics!._callbacks[this._id] = physics!._callbacks[this._id] || [];
        physics!._callbacks[this._id].push(callback);
        return _wl_physx_component_addCallback(this._id, otherComp._id || this._id);
    }

    /**
     * Remove a collision callback added with {@link PhysXComponent#onCollision} or {@link PhysXComponent#onCollisionWith}.
     *
     * @param callbackId Callback id as returned by {@link PhysXComponent#onCollision} or {@link PhysXComponent#onCollisionWith}.
     * @throws When the callback does not belong to the component.
     * @throws When the callback does not exist.
     */
    removeCollisionCallback(callbackId: number): void {
        const r = _wl_physx_component_removeCallback(this._id, callbackId);
        /* r is the amount of object to remove from the end of the
         * callbacks array for this object */
        if (r) physics!._callbacks[this._id].splice(-r);
    }
}

/** @todo: Remove as this might break tree-shaking. Instead, would be better
 * to extend the `toJSON` method to serialize / unserialize. */
for (const prop of [
    'static',
    'extents',
    'staticFriction',
    'dynamicFriction',
    'bounciness',
    'linearDamping',
    'angularDamping',
    'shape',
    'shapeData',
    'kinematic',
    'linearVelocity',
    'angularVelocity',
    'mass',
]) {
    Object.defineProperty(PhysXComponent.prototype, prop, {enumerable: true});
}
export {PhysXComponent};

/**
 * Access to the physics scene
 */
export class Physics {
    /**
     * @hidden
     *
     * **Note**: This is public to emulate a `friend` accessor.
     */
    public _callbacks: Record<string, CollisionCallback[]>;

    /** Ray Hit */
    private _rayHit: number;
    /** Hit. */
    private _hit: RayHit;

    constructor() {
        this._rayHit = _malloc(4 * (3 * 4 + 3 * 4 + 4 + 2) + 4);
        this._hit = new RayHit(this._rayHit);
        this._callbacks = {};
    }

    /**
     * Cast a ray through the physics scene and find intersecting objects.
     *
     * The resulting ray hit will contain **up to 4** closest ray hits,
     * sorted by increasing distance.
     *
     * @param o Ray origin.
     * @param d Ray direction.
     * @param group Collision group to filter by: only objects that are
     *        part of given group are considered for raycast.
     * @param maxDistance Maximum ray distance, default `100.0`.
     *
     * @returns The RayHit instance, belonging to this class.
     *
     * @note The returned {@link RayHit} object is owned by the Physics instance and
     *       will be reused with the next {@link Physics#rayCast} call.
     */
    rayCast(o: Readonly<NumberArray>, d: Readonly<NumberArray>, group: number, maxDistance?: number): RayHit {
        if (typeof maxDistance === 'undefined') maxDistance = 100.0;
        _wl_physx_ray_cast(
            o[0],
            o[1],
            o[2],
            d[0],
            d[1],
            d[2],
            group,
            maxDistance || 100,
            this._rayHit
        );
        return this._hit;
    }

    /**
     * Triggered by the WASM runtime.
     *
     * @hidden
     */
    private _callCollisionCallback(
        a: number,
        index: number,
        type: number,
        b: number
    ): void {
        physics!._callbacks[a][index](
            type,
            new PhysXComponent($Object._typeIndexFor('physx'), b)
        );
    }
}

/**
 * Mesh index type.
 */
export enum MeshIndexType {
    /** Single byte mesh index, range 0-255 */
    UnsignedByte = 1,

    /** Two byte mesh index, range 0-65535 */
    UnsignedShort = 2,

    /** Four byte mesh index, range 0-4294967295 */
    UnsignedInt = 4,
}

/**
 * Mesh constructor parameters object.
 *
 * Usage:
 *
 * ```js
 * const mesh = Mesh({vertexCount: 3, indexData: [0, 1, 2]});
 * ```
 */
export interface MeshParameters {
    /** Number of vertices to allocate. */
    vertexCount: number;
    /**
     * Deprecated, use `vertexCount` instead and set data with {@link Mesh#attribute} instead.
     *
     * Interleaved vertex data values. A vertex is a
     *      set of 8 float values:
     *          - 0-2 Position
     *          - 3-5 Normal
     *          - 6-8 Texture Coordinate
     *
     * @deprecated
     */
    vertexData: Float32Array;
    /** Index data values. */
    indexData: Readonly<NumberArray>;
    /** Index type, `null` if not indexed. */
    indexType: MeshIndexType;
    /** `true` if the mesh should be skinned. Defaults to false. */
    skinned: boolean;
}

/**
 * Wrapper around a native mesh data.
 *
 * To modify a mesh, you get access to a {@link MeshAttributeAccessor} that allows you to modify
 * the content of the buffers:
 *
 * Usage:
 *
 * ```js
 * const mesh = new Mesh({vertexCount: 3, indexData: [0, 1, 2] });
 * const positions = mesh.attribute(MeshAttribute.Position);
 * ...
 * ```
 */
export class Mesh {
    /**
     * Size of a vertex in float elements.
     * @deprecated Replaced with {@link Mesh#attribute} and {@link MeshAttributeAccessor}
     */
    static get VERTEX_FLOAT_SIZE(): number {
        return 3 + 3 + 2;
    }
    /**
     * Size of a vertex in bytes.
     * @deprecated Replaced with {@link Mesh#attribute} and {@link MeshAttributeAccessor}
     */
    static get VERTEX_SIZE(): number {
        return this.VERTEX_FLOAT_SIZE * 4;
    }

    /**
     * Position attribute offsets in float elements.
     * @deprecated Replaced with {@link Mesh#attribute} and {@link MeshAttribute#Position}
     */
    static get POS(): {X: number; Y: number; Z: number} {
        return {X: 0, Y: 1, Z: 2};
    }
    /**
     * Texture coordinate attribute offsets in float elements.
     * @deprecated Replaced with {@link Mesh#attribute} and {@link MeshAttribute#TextureCoordinate}
     */
    static get TEXCOORD(): {U: number; V: number} {
        return {U: 3, V: 4};
    }
    /**
     * Normal attribute offsets in float elements.
     * @deprecated Replaced with {@link Mesh#attribute} and {@link MeshAttribute#Normal}
     */
    static get NORMAL(): {X: number; Y: number; Z: number} {
        return {X: 5, Y: 6, Z: 7};
    }

    /**
     * Index of the mesh in the manager.
     *
     * @hidden
     */
    public _index: number;

    /**
     * Create a new instance.
     *
     * @param params Either a mesh index to wrap or set of parameters to create a new mesh.
     *    For more information, please have a look at the {@link MeshParameters} interface.
     */
    constructor(params: Partial<MeshParameters> | number) {
        if (typeof params === 'object') {
            if (!params.vertexCount && params.vertexData) {
                params.vertexCount = params.vertexData.length / Mesh.VERTEX_FLOAT_SIZE;
            }
            if (!params.vertexCount) throw new Error("Missing parameter 'vertexCount'");

            let indexData = 0;
            let indexType = 0;
            let indexDataSize = 0;
            if (params.indexData) {
                indexType = params.indexType || MeshIndexType.UnsignedShort;
                indexDataSize = params.indexData.length * indexType;
                indexData = _malloc(indexDataSize);
                /* Copy the index data into wasm memory */
                switch (indexType) {
                    case MeshIndexType.UnsignedByte:
                        HEAPU8.set(params.indexData, indexData);
                        break;
                    case MeshIndexType.UnsignedShort:
                        HEAPU16.set(params.indexData, indexData >> 1);
                        break;
                    case MeshIndexType.UnsignedInt:
                        HEAPU32.set(params.indexData, indexData >> 2);
                        break;
                }
            }

            const {skinned = false} = params;

            this._index = _wl_mesh_create(
                indexData,
                indexDataSize,
                indexType,
                params.vertexCount,
                skinned
            );

            if (params.vertexData) {
                const positions = this.attribute(MeshAttribute.Position);
                const normals = this.attribute(MeshAttribute.Normal);
                const textureCoordinates = this.attribute(MeshAttribute.TextureCoordinate);

                for (let i = 0; i < params.vertexCount; ++i) {
                    const start = i * Mesh.VERTEX_FLOAT_SIZE;
                    positions!.set(i, params.vertexData.subarray(start, start + 3));
                    textureCoordinates?.set(
                        i,
                        params.vertexData.subarray(start + 3, start + 5)
                    );
                    normals?.set(i, params.vertexData.subarray(start + 5, start + 8));
                }
            }
        } else {
            this._index = params;
        }
    }

    /**
     * Vertex data (read-only).
     *
     * @deprecated Replaced with {@link attribute}
     */
    get vertexData(): Float32Array {
        const ptr = _wl_mesh_get_vertexData(this._index, _tempMem);
        return new Float32Array(
            HEAPF32.buffer,
            ptr,
            Mesh.VERTEX_FLOAT_SIZE * HEAPU32[_tempMem / 4]
        );
    }

    /** Number of vertices in this mesh. */
    get vertexCount(): number {
        return _wl_mesh_get_vertexCount(this._index);
    }

    /** Index data (read-only) or {@link null} if the mesh is not indexed. */
    get indexData(): Uint8Array | Uint16Array | Uint32Array | null {
        const ptr = _wl_mesh_get_indexData(this._index, _tempMem, _tempMem + 4);
        if (ptr === null) return null;

        const indexCount = HEAPU32[_tempMem / 4];
        const indexSize = HEAPU32[_tempMem / 4 + 1];
        switch (indexSize) {
            case MeshIndexType.UnsignedByte:
                return new Uint8Array(HEAPU8.buffer, ptr, indexCount);
            case MeshIndexType.UnsignedShort:
                return new Uint16Array(HEAPU16.buffer, ptr, indexCount);
            case MeshIndexType.UnsignedInt:
                return new Uint32Array(HEAPU32.buffer, ptr, indexCount);
        }
        return null;
    }

    /** Updates the bounding sphere to match new vertex positions. */
    update() {
        _wl_mesh_update(this._index);
    }

    /** @overload */
    getBoundingSphere(): Float32Array;
    /** @overload */
    getBoundingSphere<T extends NumberArray>(out: T): T;
    /**
     * Mesh bounding sphere.
     *
     * @param out Preallocated array to write into, to avoid garbage,
     *     otherwise will allocate a new {@link Float32Array}.
     *
     * ```js
     *  const sphere = new Float32Array(4);
     *  for(...) {
     *      mesh.getBoundingSphere(sphere);
     *      ...
     *  }
     * ```
     *
     * If the position data is changed, call {@link Mesh#update} to update the
     * bounding sphere.
     *
     * @returns Bounding sphere, 0-2 sphere origin, 3 radius.
     */
    getBoundingSphere<T extends NumberArray>(out: T | Float32Array = new Float32Array(4)): T | Float32Array {
        _wl_mesh_get_boundingSphere(this._index, _tempMem);
        out[0] = _tempMemFloat[0];
        out[1] = _tempMemFloat[1];
        out[2] = _tempMemFloat[2];
        out[3] = _tempMemFloat[3];
        return out as T;
    }

    /**
     * Get an attribute accessor to retrieve or modify data of give attribute.
     *
     * @param attr Attribute to get access to
     * @returns {?MeshAttributeAccessor} attr Attribute to get access to or `null`,
     *      if mesh does not have this attribute.
     *
     * If there are no shaders in the scene that use `TextureCoordinate` for example,
     * no meshes will have the `TextureCoordinate` attribute.
     *
     * For flexible reusable components, take this into account that only `Position`
     * is guaranteed to be present at all time.
     */
    attribute(attr: MeshAttribute): MeshAttributeAccessor | null {
        if (typeof attr != 'number')
            throw new TypeError('Expected number, but got ' + typeof attr);
        _wl_mesh_get_attribute(this._index, attr, _tempMem);
        if (_tempMemUint32[0] == 255) return null;

        const a = new MeshAttributeAccessor(attr);
        a._attribute = _tempMemUint32[0];
        a._offset = _tempMemUint32[1];
        a._stride = _tempMemUint32[2];
        a._formatSize = _tempMemUint32[3];
        a._componentCount = _tempMemUint32[4];
        (a.length as number) = this.vertexCount;
        return a;
    }

    /**
     * Destroy and free the meshes memory.
     *
     * It is best practice to set the mesh variable to `null` after calling
     * destroy to prevent accidental use:
     *
     * ```js
     *   mesh.destroy();
     *   mesh = null;
     * ```
     *
     * Accessing the mesh after destruction behaves like accessing an empty
     * mesh.
     *
     * @since 0.9.0
     */
    destroy(): void {
        _wl_mesh_destroy(this._index);
    }
}

/**
 * An iterator over a mesh vertex attribute.
 *
 * Usage:
 *
 * ```js
 *   const mesh = this.object.getComponent('mesh').mesh;
 *   const positions = mesh.attribute(WL.MeshAttribute.Position);
 *
 *   const temp = new Float32Array(3);
 *   for(int i = 0; i < positions.length; ++i) {
 *       // pos will reference temp and thereby not allocate additional
 *       // JavaScript garbage, which would cause a perf spike when collected.
 *       const pos = positions.get(i, temp);
 *       // scale position by 2 on X axis only
 *       pos[0] *= 2.0f;
 *       positions.set(i, pos);
 *   }
 * ```
 */
export class MeshAttributeAccessor {
    /** Attribute index. @hidden */
    public _attribute: number = -1;
    /** Attribute offset. @hidden */
    public _offset: number = 0;
    /** Attribute stride. @hidden */
    public _stride: number = 0;
    /** Format size native enum. @hidden */
    public _formatSize: number = 0;
    /** Number of components per vertex. @hidden */
    public _componentCount: number = 0;

    /** Max number of elements. */
    public readonly length: number = 0;

    /**
     * Class to instantiate an ArrayBuffer to get/set values.
     */
    private _bufferType: typeof Float32Array | typeof Uint16Array;
    /**
     * Function to allocate temporary WASM memory. This is cached to avoid
     * any conditional during get/set.
     */
    private _tempBufferGetter: (bytes: number) => Float32Array | Uint16Array;

    /**
     * Create a new instance.
     *
     * @param type The type of data this accessor is wrapping.
     * @note Do not use this constructor. Instead, please use the {@link Mesh.attribute} method.
     *
     * @hidden
     */
    constructor(type = MeshAttribute.Position) {
        switch (type) {
            case MeshAttribute.Position:
            case MeshAttribute.Normal:
            case MeshAttribute.TextureCoordinate:
            case MeshAttribute.Tangent:
            case MeshAttribute.Color:
            case MeshAttribute.JointWeight:
            case MeshAttribute.SecondaryJointWeight:
                this._bufferType = Float32Array;
                this._tempBufferGetter = getTempBufferF32;
                break;
            case MeshAttribute.JointId:
            case MeshAttribute.SecondaryJointId:
                this._bufferType = Uint16Array;
                this._tempBufferGetter = getTempBufferU16;
                break;
            default:
                throw new Error(`Invalid attribute accessor type: ${type}`);
        }
    }

    /**
     * Create a new TypedArray to hold this attribute values.
     *
     * This method is useful to create a view to hold the data to
     * pass to {@link MeshAttributeAccessor.get} and {@link MeshAttributeAccessor.set}
     *
     * Example:
     *
     * ```js
     * const vertexCount = 4;
     * const positionAttribute = mesh.attribute(MeshAttributes.Position);
     *
     * // A position has 3 floats per vertex. Thus, positions has length 3 * 4.
     * const positions = positionAttribute.createArray(vertexCount);
     * ```
     *
     * @param count The number of **vertices** expected.
     * @returns A TypedArray with the appropriate format to access the data
     */
    createArray(count = 1): Float32Array | Uint16Array {
        count = count > this.length ? this.length : count;
        return new this._bufferType(count * this._componentCount);
    }

    /** @overload */
    get(index: number): Float32Array | Uint16Array;
    /**
     * Get attribute element.
     *
     * @param {number} index Index
     * @param out Preallocated array to write into,
     *      to avoid garbage, otherwise will allocate a new TypedArray.
     *
     * `out.length` needs to be a multiple of the attributes component count, see
     * {@link MeshAttribute}. If `out.length` is more than one multiple, it will be
     * filled with the next n attribute elements, which can reduce overhead
     * of this call.
     *
     * @returns The `out` parameter
     */
    get<T extends NumberArray>(index: number, out: T | Float32Array | Uint16Array = this.createArray()) {
        if (out.length % this._componentCount !== 0)
            throw new Error(
                `out.length, ${out.length} is not a multiple of the attribute vector components, ${this._componentCount}`
            );

        const dest = this._tempBufferGetter(out.length);
        const bytesPerElt = this._bufferType.BYTES_PER_ELEMENT;
        const bytes = bytesPerElt * out.length;
        const destFormatSize = this._componentCount * bytesPerElt;

        _wl_mesh_get_attribute_values(
            this._attribute,
            this._formatSize,
            this._offset + index * this._stride,
            this._stride,
            destFormatSize,
            dest.byteOffset,
            bytes
        );

        for (let i = 0; i < out.length; ++i) out[i] = dest[i];
        return out;
    }

    /**
     * Set attribute element.
     *
     * @param i Index
     * @param v Value to set the element to
     *
     * `v.length` needs to be a multiple of the attributes component count, see
     * {@link MeshAttribute}. If `v.length` is more than one multiple, it will be
     * filled with the next n attribute elements, which can reduce overhead
     * of this call.
     *
     * @returns Reference to self (for method chaining)
     */
    set(i: number, v: Readonly<NumberArray>) {
        if (v.length % this._componentCount !== 0)
            throw new Error(
                `out.length, ${v.length} is not a multiple of the attribute vector components, ${this._componentCount}`
            );

        const bytesPerElt = this._bufferType.BYTES_PER_ELEMENT;
        const bytes = bytesPerElt * v.length;
        const srcFormatSize = this._componentCount * bytesPerElt;

        /* Unless we are already working with data from WASM heap, we
         * need to copy into temporary memory. */
        if ((v as Float32Array).buffer != HEAPU8.buffer) {
            const dest = this._tempBufferGetter(v.length);
            dest.set(v);
            v = dest;
        }

        _wl_mesh_set_attribute_values(
            this._attribute,
            srcFormatSize,
            (v as Float32Array).byteOffset,
            bytes,
            this._formatSize,
            this._offset + i * this._stride,
            this._stride
        );

        return this;
    }
}

/**
 * Constructor parameters object for a {@link Material} instance.
 */
export interface MaterialParameters {
    /** The name of the pipeline. */
    pipeline: string;
}

/**
 * Wrapper around a native material.
 *
 * Each material instance will have properties associated to the pipeline it uses.
 * The material properties are automatically added to each material instance, example:
 *
 * ```js
 * const material = mesh.material; // Material with a `Phong Opaque Textured` pipeline
 * // You can access all the material properties from the editor using:
 * material.diffuseTexture = null;
 * material.diffuseColor = [1.0, 0.0, 0.0, 1.0];
 * ```
 */
export class Material {
    /**
     * Index of this material in the manager.
     *
     * @hidden
     */
    public _index: number;

    /**
     * Material definition index in the scene.
     *
     * @hidden
     */
    private _definition: number;

    /**
     * Create a new Material.
     *
     * @note Creating material is expensive. Please use {@link Material#clone} to clone a material.
     * @note Do not use this constructor directly with an index, this is reserved for internal purposes.
     */
    constructor(params: number | MaterialParameters) {
        if (typeof params !== 'number') {
            if (!params?.pipeline) throw new Error("Missing parameter 'pipeline'");
            const pipeline = params.pipeline;
            const lengthBytes = lengthBytesUTF8(pipeline) + 1;
            stringToUTF8(pipeline, _tempMem, lengthBytes);
            this._index = _wl_material_create(_tempMem);
            if (this._index < 0) throw new Error(`No such pipeline '${pipeline}'`);
        } else {
            this._index = params;
        }

        this._definition = _wl_material_get_definition(this._index);
        if (!_WL._materialDefinitions[this._definition])
            throw new Error(
                `Material Definition ${this._definition} not found for material with index ${this._index}`
            );

        return new Proxy(this, {
            get(target, prop) {
                const definition = _WL._materialDefinitions[target._definition];
                const param = definition.get(prop);
                if (!param) return (target as {[key: string | symbol]: any})[prop];
                if (_wl_material_get_param_value(target._index, param.index, _tempMem)) {
                    const type = param.type;
                    switch (type.type) {
                        case MaterialParamType.UnsignedInt:
                            return type.componentCount == 1
                                ? _tempMemUint32[0]
                                : new Uint32Array(
                                      HEAPU32.buffer,
                                      _tempMem,
                                      type.componentCount
                                  );
                        case MaterialParamType.Int:
                            return type.componentCount == 1
                                ? _tempMemInt[0]
                                : new Int32Array(
                                      HEAP32.buffer,
                                      _tempMem,
                                      type.componentCount
                                  );
                        case MaterialParamType.Float:
                            return type.componentCount == 1
                                ? _tempMemFloat[0]
                                : new Float32Array(
                                      HEAPF32.buffer,
                                      _tempMem,
                                      type.componentCount
                                  );
                        case MaterialParamType.Sampler:
                            return new Texture(_tempMemInt[0]);
                        default:
                            throw new Error(
                                `Invalid type ${type} on parameter ${param.index} for material ${target._index}`
                            );
                    }
                }
            },

            set(target, prop, value) {
                const definition = _WL._materialDefinitions[target._definition];
                const param = definition.get(prop);
                if (!param) {
                    (target as {[key: string | symbol]: any})[prop] = value;
                    return true;
                }
                const type = param.type;
                switch (type.type) {
                    case MaterialParamType.UnsignedInt:
                    case MaterialParamType.Int:
                    case MaterialParamType.Sampler:
                        const v = value instanceof Texture ? value.id : value;
                        _wl_material_set_param_value_uint(target._index, param.index, v);
                        break;
                    case MaterialParamType.Float:
                        let count = 1;
                        if (typeof value === 'number') {
                            _tempMemFloat[0] = value;
                        } else {
                            count = value.length;
                            for (let i = 0; i < count; ++i) _tempMemFloat[i] = value[i];
                        }
                        _wl_material_set_param_value_float(
                            target._index,
                            param.index,
                            _tempMem,
                            count
                        );
                        break;
                    case MaterialParamType.Font:
                        throw new Error(
                            'Setting font properties is currently unsupported.'
                        );
                }
                return true;
            },
        });
    }

    /** Name of the shader used by this material. */
    get shader(): string {
        return UTF8ToString(_wl_material_get_shader(this._index));
    }

    /**
     * Create a copy of the underlying native material.
     *
     * @returns Material clone.
     */
    clone(): Material | null {
        const id = _wl_material_clone(this._index);
        return id > 0 ? new Material(id) : null;
    }

    /**
     * Wrap a native material index.
     *
     * @param index The index.
     * @returns Material instance or {@link null} if index <= 0.
     *
     * @deprecated Please use `new Material()` instead.
     */
    static wrap(index: number): Material | null {
        /** @todo: this propagate nullable in the entire codebase. Remove. */
        return index > 0 ? new Material(index) : null;
    }
}

/** Temporary canvas */
let tempCanvas: HTMLCanvasElement | null = null;

/**
 * Wrapper around a native texture data.
 */
export class Texture {
    /** Index in the manager. @hidden */
    private _id: number = 0;
    /** HTML image index. @hidden */
    private _imageIndex: number = undefined!; /* @todo: Remove undefined */

    /**
     * @param param HTML media element to create texture from or texture id to wrap.
     */
    constructor(param: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | number) {
        if (
            param instanceof HTMLImageElement ||
            param instanceof HTMLVideoElement ||
            param instanceof HTMLCanvasElement
        ) {
            const index = _images.length;
            _images.push(param);
            this._imageIndex = index;
            this._id = _wl_renderer_addImage(index);
        } else {
            this._id = param;
        }
        textures[this._id] = this;
    }

    /** Whether this texture is valid. */
    get valid(): boolean {
        return this._id >= 0;
    }

    /** Index in this manager. */
    get id(): number {
        return this._id;
    }

    /** Update the texture to match the HTML element (e.g. reflect the current frame of a video). */
    update() {
        if (!this.valid) return;
        _wl_renderer_updateImage(this._id, this._imageIndex);
    }

    /** Width of the texture. */
    get width(): number {
        return _wl_texture_width(this._id);
    }

    /** Height of the texture. */
    get height(): number {
        return _wl_texture_height(this._id);
    }

    /**
     * Update a subrange on the texture to match the HTML element (e.g. reflect the current frame of a video).
     *
     * Usage:
     *
     * ```js
     * // Copies rectangle of pixel starting from (10, 20)
     * texture.updateSubImage(10, 20, 600, 400);
     * ```
     *
     * @param x x offset
     * @param y y offset
     * @param w width
     * @param h height
     */
    updateSubImage(x: number, y: number, w: number, h: number): void {
        if (!this.valid) return;

        /* Lazy initialize temp canvas */
        if (!tempCanvas) tempCanvas = document.createElement('canvas');

        const img = _images[this._imageIndex];
        if (!img) return;

        tempCanvas.width = w;
        tempCanvas.height = h;
        /* @todo: Would be smarted to cache context. */
        tempCanvas.getContext('2d')?.drawImage(img, x, y, w, h, 0, 0, w, h);
        /* @todo: Do not store temporary canvas. */
        _images[this._imageIndex] = tempCanvas;

        try {
            _wl_renderer_updateImage(
                this._id,
                this._imageIndex,
                x,
                ((img as HTMLVideoElement).videoHeight || img.height) - y - h
            );
        } finally {
            _images[this._imageIndex] = img;
        }
    }

    /**
     * Destroy and free the texture's texture altas space and memory.
     *
     * It is best practice to set the texture variable to `null` after calling
     * destroy to prevent accidental use of the invalid texture:
     *
     * ```js
     *   texture.destroy();
     *   texture = null;
     * ```
     *
     * @since 0.9.0
     */
    destroy(): void {
        _wl_texture_destroy(this._id);
        if (this._imageIndex) {
            _images[this._imageIndex] = null;
            this._imageIndex = undefined!;
        }
    }
}

/* @todo: the `textures` literal should have a better shape/api. */
export type TextureCache = {
    [key: string]: Texture | ((filename: string, crossOrigin?: string) => Promise<Texture>);
    load: (filename: string, crossOrigin?: string) => Promise<Texture>;
};

/**
 * Access to the textures managed by Wonderland Engine.
 */
const textures: TextureCache = {
    /**
     * Load an image from URL as {@link Texture}
     * @param {string} filename URL to load from
     * @param {string} crossOrigin Cross origin flag for the {@link Image} object
     * @returns {Promise<Texture>} Loaded texture
     */
    load: function (filename: string, crossOrigin?: string): Promise<Texture> {
        let image = new Image();
        if (crossOrigin !== undefined) {
            image.crossOrigin = crossOrigin;
        }
        image.src = filename;
        return new Promise((resolve, reject) => {
            image.onload = function () {
                let texture = new Texture(image);
                if (!texture.valid) {
                    reject(
                        'Failed to add image ' +
                            image.src +
                            ' to texture atlas. Probably incompatible format.'
                    );
                }
                resolve(texture);
            };
        });
    },
};

/**
 * Wrapper around a native animation.
 */
export class Animation {
    /** Index of the mesh in the manager. @hidden */
    public _index: number;

    /**
     * @param index Index in the manager
     */
    constructor(index: number) {
        this._index = index;
    }

    /** Duration of this animation. */
    get duration(): number {
        return _wl_animation_get_duration(this._index);
    }

    /** Number of tracks in this animation. */
    get trackCount(): number {
        return _wl_animation_get_trackCount(this._index);
    }

    /**
     * Clone this animation retargeted to a new set of objects.
     *
     * The clone shares most of the data with the original and is therefore
     * light-weight.
     *
     * **Experimental:** This API might change in upcoming versions.
     *
     * If retargetting to {@link Skin}, the join names will be used to determine a mapping
     * from the previous skin to the new skin. The source skin will be retrieved from
     * the first track in the animation that targets a joint.
     *
     * @param newTargets New targets per track. Expected to have
     *      {@link Animation#trackCount} elements or to be a {@link Skin}.
     * @returns The retargeted clone of this animation.
     */
    retarget(newTargets: $Object[] | Skin): Animation {
        if (newTargets instanceof Skin) {
            const animId = _wl_animation_retargetToSkin(this._index, newTargets._index);
            return new Animation(animId);
        }

        if (newTargets.length != this.trackCount) {
            throw Error(
                'Expected ' +
                    this.trackCount.toString() +
                    ' targets, but got ' +
                    newTargets.length.toString()
            );
        }
        const ptr = _malloc(2 * newTargets.length);
        for (let i = 0; i < newTargets.length; ++i) {
            HEAPU16[ptr >> (1 + i)] = (newTargets[i] as $Object).objectId;
        }
        const animId = _wl_animation_retarget(this._index, ptr);
        _free(ptr);

        return new Animation(animId);
    }
}

/**
 * Scene graph object.
 *
 * Node in the scene graph or "entity". Consists of transformation and a reference
 * to its parent object. Usually holds components and is accessible by components
 * through {@link Component#object}.
 *
 * Objects are stored in a data oriented manner inside WebAssembly memory. This class
 * is a JavaScript API wrapper around this memory for more convenient use in
 * components.
 *
 * Objects can be created and added to a scene through
 * {@link Scene#addObject} on the {@link scene|main scene}.
 */
class $Object {
    /**
     * Object index in the manager.
     */
    public objectId: number; /* @todo: Make private */

    /**
     * @param o Object id to wrap
     */
    constructor(o: number) {
        this.objectId = o;
    }

    /**
     * Name of the object.
     *
     * Useful for identifying objects during debugging.
     */
    get name(): string {
        return UTF8ToString(_wl_object_name(this.objectId));
    }

    /**
     * Set the object's name.
     *
     * @param newName The new name to set.
     */
    set name(newName: string) {
        const lengthBytes = lengthBytesUTF8(newName) + 1;
        const mem = _malloc(lengthBytes);
        stringToUTF8(newName, mem, lengthBytes);
        _wl_object_set_name(this.objectId, mem);
        _free(mem);
    }

    /**
     * Parent of this object or {@link null} if parented to root.
     */
    get parent(): $Object | null {
        const p = _wl_object_parent(this.objectId);
        return p == 0 ? null : _wrapObject(p);
    }

    /**
     * Children of this object.
     */
    get children(): $Object[] {
        const childrenCount = _wl_object_get_children_count(this.objectId);
        if (childrenCount === 0) return [];

        requireTempMem(childrenCount * 2);

        _wl_object_get_children(this.objectId, _tempMem, _tempMemSize >> 1);

        const children = new Array(childrenCount);
        for (let i = 0; i < childrenCount; ++i) {
            children[i] = _wrapObject(_tempMemUint16[i]);
        }
        return children;
    }

    /**
     * Reparent object to given object.
     *
     * @note Reparenting is not trivial and might have a noticeable performance impact.
     *
     * @param newParent New parent or {@link null} to parent to root
     */
    set parent(newParent: $Object | undefined | null) {
        _wl_object_set_parent(this.objectId, newParent == null ? 0 : newParent.objectId);
    }

    /** Reset local transformation (translation, rotation and scaling) to identity. */
    resetTransform(): void {
        _wl_object_reset_translation_rotation(this.objectId);
        _wl_object_reset_scaling(this.objectId);
    }

    /** Reset local translation and rotation to identity */
    resetTranslationRotation(): void {
        _wl_object_reset_translation_rotation(this.objectId);
    }

    /**
     * Reset local rotation, keep translation.
     * @note To reset both rotation and translation, prefer
     *       {@link resetTranslationRotation}.
     */
    resetRotation(): void {
        _wl_object_reset_rotation(this.objectId);
    }

    /**
     * Reset local translation, keep rotation.
     * @note To reset both rotation and translation, prefer
     *       {@link resetTranslationRotation}.
     */
    resetTranslation(): void {
        _wl_object_reset_translation(this.objectId);
    }

    /** Reset local scaling to identity (``[1.0, 1.0, 1.0]``). */
    resetScaling(): void {
        _wl_object_reset_scaling(this.objectId);
    }

    /**
     * Translate object by a vector in the parent's space.
     * @param v Vector to translate by.
     */
    translate(v: Readonly<NumberArray>): void {
        _wl_object_translate(this.objectId, v[0], v[1], v[2]);
    }

    /**
     * Translate object by a vector in object space.
     * @param v Vector to translate by.
     */
    translateObject(v: Readonly<NumberArray>): void {
        _wl_object_translate_obj(this.objectId, v[0], v[1], v[2]);
    }

    /**
     * Translate object by a vector in world space.
     * @param v Vector to translate by.
     */
    translateWorld(v: Readonly<NumberArray>): void {
        _wl_object_translate_world(this.objectId, v[0], v[1], v[2]);
    }

    /**
     * Rotate around given axis by given angle (degrees) in local space.
     *
     * @param a Vector representing the rotation axis.
     * @param d Angle in degrees.
     *
     * @note If the object is translated the rotation will be around
     *     the parent. To rotate around the object origin, use
     *     {@link rotateAxisAngleDegObject}
     *
     * @see {@link rotateAxisAngleRad}
     */
    rotateAxisAngleDeg(a: Readonly<NumberArray>, d: number): void {
        _wl_object_rotate_axis_angle(this.objectId, a[0], a[1], a[2], d);
    }

    /**
     * Rotate around given axis by given angle (radians) in local space.
     *
     * @param {number[]} a Vector representing the rotation axis.
     * @param {number} d Angle in radians.
     *
     * @note If the object is translated the rotation will be around
     *     the parent. To rotate around the object origin, use
     *     {@link rotateAxisAngleDegObject}
     *
     * @see {@link rotateAxisAngleDeg}
     */
    rotateAxisAngleRad(a: Readonly<NumberArray>, d: number): void {
        _wl_object_rotate_axis_angle_rad(this.objectId, a[0], a[1], a[2], d);
    }

    /**
     * Rotate around given axis by given angle (degrees) in object space.
     *
     * @param a Vector representing the rotation axis.
     * @param d Angle in degrees.
     *
     * Equivalent to prepending a rotation quaternion to the object's
     * local transformation.
     *
     * @see {@link rotateAxisAngleRadObject}
     */
    rotateAxisAngleDegObject(a: Readonly<NumberArray>, d: number): void {
        _wl_object_rotate_axis_angle_obj(this.objectId, a[0], a[1], a[2], d);
    }

    /**
     * Rotate around given axis by given angle (radians) in object space
     * Equivalent to prepending a rotation quaternion to the object's
     * local transformation.
     *
     * @param a Vector representing the rotation axis
     * @param d Angle in degrees
     *
     * @see {@link rotateAxisAngleDegObject}
     */
    rotateAxisAngleRadObject(a: Readonly<NumberArray>, d: number): void {
        _wl_object_rotate_axis_angle_rad_obj(this.objectId, a[0], a[1], a[2], d);
    }

    /**
     * Rotate by a quaternion.
     *
     * @param q the Quaternion to rotate by.
     */
    rotate(q: Readonly<NumberArray>): void {
        _wl_object_rotate_quat(this.objectId, q[0], q[1], q[2], q[3]);
    }

    /**
     * Rotate by a quaternion in object space.
     *
     * Equivalent to prepending a rotation quaternion to the object's
     * local transformation.
     *
     * @param q the Quaternion to rotate by.
     */
    rotateObject(q: Readonly<NumberArray>): void {
        _wl_object_rotate_quat_obj(this.objectId, q[0], q[1], q[2], q[3]);
    }

    /**
     * Scale object by a vector in object space.
     *
     * @param v Vector to scale by.
     */
    scale(v: Readonly<NumberArray>): void {
        _wl_object_scale(this.objectId, v[0], v[1], v[2]);
    }

    /** Local / object space transformation. */
    get transformLocal(): Float32Array {
        return new Float32Array(HEAPF32.buffer, _wl_object_trans_local(this.objectId), 8);
    }

    /**
     * Set local transform.
     *
     * @param t Local space transformation.
     *
     * @since 0.8.5
     */
    set transformLocal(t: Readonly<NumberArray>) {
        this.transformLocal.set(t);
        this.setDirty();
    }

    /**
     * Compute local / object space translation from transformation.
     *
     * @param out Destination array/vector, expected to have at least 3 elements.
     * @return The `out` parameter.
     */
    getTranslationLocal<T extends NumberArray>(out: T): T {
        _wl_object_get_translation_local(this.objectId, _tempMem);
        out[0] = _tempMemFloat[0];
        out[1] = _tempMemFloat[1];
        out[2] = _tempMemFloat[2];
        return out;
    }

    /**
     * Compute world space translation from transformation.
     *
     * May recompute transformations of the hierarchy of this object,
     * if they were changed by JavaScript components this frame.
     *
     * @param out Destination array/vector, expected to have at least 3 elements.
     * @return The `out` parameter.
     */
    getTranslationWorld<T extends NumberArray>(out: T): T {
        _wl_object_get_translation_world(this.objectId, _tempMem);
        out[0] = _tempMemFloat[0];
        out[1] = _tempMemFloat[1];
        out[2] = _tempMemFloat[2];
        return out;
    }

    /**
     * Set local / object space translation.
     *
     * Concatenates a new translation dual quaternion onto the existing rotation.
     *
     * @param v New local translation array/vector, expected to have at least 3 elements.
     */
    setTranslationLocal(v: Readonly<NumberArray>): void {
        _wl_object_set_translation_local(this.objectId, v[0], v[1], v[2]);
    }

    /**
     * Set world space translation.
     *
     * Applies the inverse parent transform with a new translation dual quaternion
     * which is concatenated onto the existing rotation.
     *
     * @param v New world translation array/vector, expected to have at least 3 elements.
     */
    setTranslationWorld(v: Readonly<NumberArray>): void {
        _wl_object_set_translation_world(this.objectId, v[0], v[1], v[2]);
    }

    /**
     * Global / world space transformation.
     *
     * May recompute transformations of the hierarchy of this object,
     * if they were changed by JavaScript components this frame.
     */
    get transformWorld(): Float32Array {
        return new Float32Array(HEAPF32.buffer, _wl_object_trans_world(this.objectId), 8);
    }

    /**
     * Set world transform.
     *
     * @param t Global / world space transformation.
     *
     * @since 0.8.5
     */
    set transformWorld(t: Readonly<NumberArray>) {
        this.transformWorld.set(t);
        _wl_object_trans_world_to_local(this.objectId);
    }

    /** Local / object space scaling. */
    get scalingLocal(): Float32Array {
        return new Float32Array(HEAPF32.buffer, _wl_object_scaling_local(this.objectId), 3);
    }

    /**
     * Set scaling local.
     *
     * @param s Global / world space transformation.
     *
     * @since 0.8.7
     */
    set scalingLocal(s: Readonly<NumberArray>) {
        this.scalingLocal.set(s);
        this.setDirty();
    }

    /**
     * Global / world space scaling.
     *
     * May recompute transformations of the hierarchy of this object,
     * if they were changed by JavaScript components this frame.
     */
    get scalingWorld(): Float32Array {
        return new Float32Array(HEAPF32.buffer, _wl_object_scaling_world(this.objectId), 3);
    }

    /**
     * Set scaling world.
     *
     * @param t Global / world space transformation.
     *
     * @since 0.8.7
     */
    set scalingWorld(s: Readonly<NumberArray>) {
        this.scalingWorld.set(s);
        _wl_object_scaling_world_to_local(this.objectId);
    }

    /**
     * Local space rotation.
     *
     * @since 0.8.7
     */
    get rotationLocal(): Float32Array {
        return this.transformLocal.subarray(0, 4);
    }

    /**
     * Global / world space rotation
     *
     * @since 0.8.7
     */
    get rotationWorld(): Float32Array {
        return this.transformWorld.subarray(0, 4);
    }

    /**
     * Set rotation local
     *
     * @param r Local space rotation
     *
     * @since 0.8.7
     */
    set rotationLocal(r: Readonly<NumberArray>) {
        _wl_object_set_rotation_local(this.objectId, r[0], r[1], r[2], r[3]);
    }

    /**
     * Set rotation world.
     *
     * @param {number} r Global / world space rotation.
     *
     * @since 0.8.7
     */
    set rotationWorld(r: Readonly<NumberArray>) {
        _wl_object_set_rotation_world(this.objectId, r[0], r[1], r[2], r[3]);
    }

    /**
     * Compute the object's forward facing world space vector.
     *
     * @param out Destination array/vector, expected to have at least 3 elements.
     * @return The `out` parameter.
     */
    getForward<T extends NumberArray>(out: T): T {
        out[0] = 0;
        out[1] = 0;
        out[2] = -1;
        this.transformVectorWorld(out);
        return out;
    }

    /**
     * Compute the object's up facing world space vector.
     *
     * @param out Destination array/vector, expected to have at least 3 elements.
     * @return The `out` parameter.
     */
    getUp<T extends NumberArray>(out: T): T {
        out[0] = 0;
        out[1] = 1;
        out[2] = 0;
        this.transformVectorWorld(out);
        return out;
    }

    /**
     * Compute the object's right facing world space vector/
     *
     * @param out Destination array/vector, expected to have at least 3 elements.
     * @return The `out` parameter.
     */
    getRight<T extends NumberArray>(out: T): T {
        out[0] = 1;
        out[1] = 0;
        out[2] = 0;
        this.transformVectorWorld(out);
        return out;
    }

    /**
     * Transform a vector by this object's world transform.
     *
     * @param out Out point
     * @param v Point to transform, default `out`
     * @return The `out` parameter.
     *
     * @since 0.8.7
     */
    transformVectorWorld<T extends NumberArray>(out: T, v?: NumberArray): T {
        v = v || out;
        _tempMemFloat[0] = v[0];
        _tempMemFloat[1] = v[1];
        _tempMemFloat[2] = v[2];
        _wl_object_transformVectorWorld(this.objectId, _tempMem);
        out[0] = _tempMemFloat[0];
        out[1] = _tempMemFloat[1];
        out[2] = _tempMemFloat[2];
        return out;
    }

    /**
     * Transform a vector by this object's local transform
     *
     * @param out Out point
     * @param v Point to transform, default `out`
     * @return The `out` parameter.
     *
     * @since 0.8.7
     */
    transformVectorLocal<T extends NumberArray>(out: T, v?: NumberArray): T {
        v = v || out;
        _tempMemFloat[0] = v[0];
        _tempMemFloat[1] = v[1];
        _tempMemFloat[2] = v[2];
        _wl_object_transformVectorLocal(this.objectId, _tempMem);
        out[0] = _tempMemFloat[0];
        out[1] = _tempMemFloat[1];
        out[2] = _tempMemFloat[2];

        return out;
    }

    /**
     * Transform a point by this object's world transform.
     *
     * @param out Out point.
     * @param p Point to transform, default `out`.
     * @return The `out` parameter.
     *
     * @since 0.8.7
     */
    transformPointWorld<T extends NumberArray>(out: T, p?: NumberArray): T {
        p = p || out;
        _tempMemFloat[0] = p[0];
        _tempMemFloat[1] = p[1];
        _tempMemFloat[2] = p[2];
        _wl_object_transformPointWorld(this.objectId, _tempMem);
        out[0] = _tempMemFloat[0];
        out[1] = _tempMemFloat[1];
        out[2] = _tempMemFloat[2];

        return out;
    }

    /**
     * Transform a point by this object's local transform.
     *
     * @param out Out point.
     * @param p Point to transform, default `out`.
     * @return The `out` parameter.
     *
     * @since 0.8.7
     */
    transformPointLocal<T extends NumberArray>(out: T, p?: NumberArray): T {
        p = p || out;
        _tempMemFloat[0] = p[0];
        _tempMemFloat[1] = p[1];
        _tempMemFloat[2] = p[2];
        _wl_object_transformPointLocal(this.objectId, _tempMem);
        out[0] = _tempMemFloat[0];
        out[1] = _tempMemFloat[1];
        out[2] = _tempMemFloat[2];

        return out;
    }

    /**
     * Transform a vector by this object's inverse world transform.
     *
     * @param {number[]} out Out point.
     * @param {number[]} v Vector to transform, default `out`.
     * @return The `out` parameter.
     *
     * @since 0.8.7
     */
    transformVectorInverseWorld<T extends NumberArray>(
        out: T,
        v?: NumberArray
    ): T {
        v = v || out;
        _tempMemFloat[0] = v[0];
        _tempMemFloat[1] = v[1];
        _tempMemFloat[2] = v[2];
        _wl_object_transformVectorInverseWorld(this.objectId, _tempMem);
        out[0] = _tempMemFloat[0];
        out[1] = _tempMemFloat[1];
        out[2] = _tempMemFloat[2];

        return out;
    }

    /**
     * Transform a point by this object's inverse local transform.
     *
     * @param out Out point
     * @param v Vector to transform, default `out`
     * @return The `out` parameter.
     *
     * @since 0.8.7
     */
    transformVectorInverseLocal<T extends NumberArray>(
        out: T,
        v?: NumberArray
    ): T {
        v = v || out;
        _tempMemFloat[0] = v[0];
        _tempMemFloat[1] = v[1];
        _tempMemFloat[2] = v[2];
        _wl_object_transformVectorInverseLocal(this.objectId, _tempMem);
        out[0] = _tempMemFloat[0];
        out[1] = _tempMemFloat[1];
        out[2] = _tempMemFloat[2];

        return out;
    }

    /**
     * Transform a point by this object's inverse world transform.
     *
     * @param out Out point.
     * @param v Point to transform, default `out`.
     * @return The `out` parameter.
     *
     * @since 0.8.7
     */
    transformPointInverseWorld<T extends NumberArray>(
        out: T,
        p?: NumberArray
    ): T {
        p = p || out;
        _tempMemFloat[0] = p[0];
        _tempMemFloat[1] = p[1];
        _tempMemFloat[2] = p[2];
        _wl_object_transformPointInverseWorld(this.objectId, _tempMem);
        out[0] = _tempMemFloat[0];
        out[1] = _tempMemFloat[1];
        out[2] = _tempMemFloat[2];

        return out;
    }

    /**
     * Transform a point by this object's inverse local transform.
     *
     * @param out Out point.
     * @param p Point to transform, default `out`.
     * @return The `out` parameter.
     *
     * @since 0.8.7
     */
    transformPointInverseLocal<T extends NumberArray>(
        out: T,
        p?: NumberArray
    ): T {
        p = p || out;
        _tempMemFloat.set(p);
        _wl_object_transformPointInverseLocal(this.objectId, _tempMem);
        out[0] = _tempMemFloat[0];
        out[1] = _tempMemFloat[1];
        out[2] = _tempMemFloat[2];

        return out;
    }

    /**
     * Transform an object space dual quaternion into world space.
     *
     * @param out Out transformation.
     * @param q Local space transformation, default `out`.
     * @return The `out` parameter.
     *
     * @since 0.8.7
     */
    toWorldSpaceTransform<T extends NumberArray>(out: T, q?: NumberArray): T {
        q = q || out;
        _tempMemFloat.set(q);
        _wl_object_toWorldSpaceTransform(this.objectId, _tempMem);
        out[0] = _tempMemFloat[0];
        out[1] = _tempMemFloat[1];
        out[2] = _tempMemFloat[2];
        out[3] = _tempMemFloat[3];

        out[4] = _tempMemFloat[4];
        out[5] = _tempMemFloat[5];
        out[6] = _tempMemFloat[6];
        out[7] = _tempMemFloat[7];

        return out;
    }

    /**
     * Transform a world space dual quaternion into local space
     *
     * @param {number[]} out Out transformation
     * @param {number[]} q World space transformation, default `out`
     * @return The `out` parameter.
     *
     * @since 0.8.7
     */
    toLocalSpaceTransform<T extends NumberArray>(out: T, q?: NumberArray): T {
        const p = this.parent;
        q = q || out;
        if (!p) {
            if (out !== q) {
                out[0] = q[0];
                out[1] = q[1];
                out[2] = q[2];
                out[3] = q[3];
                out[4] = q[4];
                out[5] = q[5];
                out[6] = q[6];
                out[7] = q[7];
            }
        } else {
            /* @todo: This is broken. It should use `out`. */
            p.toObjectSpaceTransform(q as number[]);
        }
        return out;
    }

    /**
     * Transform a world space dual quaternion into object space
     *
     * @param out Out transformation.
     * @param q World space transformation, default `out`
     * @return The `out` parameter.
     *
     * @since 0.8.7
     */
    toObjectSpaceTransform<T extends NumberArray>(out: T, q?: NumberArray): T {
        q = q || out;
        _tempMemFloat.set(q);
        _wl_object_toObjectSpaceTransform(this.objectId, _tempMem);
        out[0] = _tempMemFloat[0];
        out[1] = _tempMemFloat[1];
        out[2] = _tempMemFloat[2];
        out[3] = _tempMemFloat[3];

        out[4] = _tempMemFloat[4];
        out[5] = _tempMemFloat[5];
        out[6] = _tempMemFloat[6];
        out[7] = _tempMemFloat[7];

        return out;
    }

    /**
     * Turn towards / look at target.
     *
     * @param v Target vector to turn towards.
     * @param up Up vector of this object, default `[0, 1, 0]`.
     */
    lookAt(v: NumberArray, up: NumberArray = UP_VECTOR): void {
        _wl_object_lookAt(this.objectId, v[0], v[1], v[2], up[0], up[1], up[2]);
    }

    /** Destroy the object with all of its components and remove it from the scene */
    destroy(): void {
        _wl_scene_remove_object(this.objectId);
        /* @todo: Shouldn't be `null` otherwise the API is unexpected */
        this.objectId = null!;
    }

    /**
     * Mark transformation dirty.
     *
     * Causes an eventual recalculation of {@link transformWorld}, either
     * on next {@link getTranslationWorld}, {@link transformWorld} or
     * {@link scalingWorld} or the beginning of next frame, whichever
     * happens first.
     */
    setDirty(): void {
        _wl_object_set_dirty(this.objectId);
    }

    /**
     * Disable/enable all components of this object.
     *
     * @param b New state for the components.
     *
     * @since 0.8.5
     */
    set active(b: boolean) {
        const comps = this.getComponents();
        for (let c of comps) {
            c.active = b;
        }
    }

    /**
     * Get a component attached to this object.
     *
     * @param typeOrClass Type name. It's also possible to give a class definition.
     *     In this case, the method will use the `class.TypeName` field to find the component.
     * @param index=0 Index for component of given type. This can be used to access specific
     *      components if the object has multiple components of the same type.
     * @returns The component or {@link null} if there is no such component on this object
     */
    getComponent<T extends Component>(
        typeOrClass: string | ComponentConstructor<T>,
        index: number
    ): T | null {
        const type = isString(typeOrClass)
            ? (typeOrClass as string)
            : (typeOrClass as ComponentConstructor<T>).TypeName;
        const lengthBytes = lengthBytesUTF8(type) + 1;
        const mem = _malloc(lengthBytes);
        stringToUTF8(type, mem, lengthBytes);
        const componentType = _wl_get_component_manager_index(mem);
        _free(mem);

        if (componentType < 0) {
            /* Not a native component, try js: */
            const typeIndex = _WL._componentTypeIndices[type];
            const jsIndex = _wl_get_js_component_index(
                this.objectId,
                typeIndex,
                index || 0
            );
            return jsIndex < 0 ? null : _WL._components[jsIndex];
        }

        const componentId = _wl_get_component_id(this.objectId, componentType, index || 0);
        return _wrapComponent(type, componentType, componentId);
    }

    /**
     * @param typeOrClass Type name, pass a falsey value (`undefined` or {@link null}) to retrieve all.
     *     It's also possible to give a class definition. In this case, the method will use the `class.TypeName` field to
     *     find the components.
     * @returns All components of given type attached to this object.
     *
     * @note As this function is non-trivial, avoid using it in `update()` repeatedly,
     *      but rather store its result in `init()` or `start()`
     * @warning This method will currently return at most 341 components.
     */
    getComponents<T extends Component>(
        typeOrClass?: string | ComponentConstructor<T> | null
    ): T[] {
        let componentType = null;
        let type = null;
        if (typeOrClass) {
            type = isString(typeOrClass)
                ? (typeOrClass as string)
                : (typeOrClass as ComponentConstructor<T>).TypeName;
            componentType = $Object._typeIndexFor(type);
        }
        const components = [];
        const maxComps = Math.floor((_tempMemSize / 3) * 2);
        const componentsCount = _wl_object_get_components(
            this.objectId,
            _tempMem,
            maxComps
        );
        const offset = 2 * componentsCount;
        _wl_object_get_component_types(this.objectId, _tempMem + offset, maxComps);

        const jsManagerIndex = $Object._typeIndexFor('js');
        for (let i = 0; i < componentsCount; ++i) {
            const t = _tempMemUint8[i + offset];
            const componentId = _tempMemUint16[i];
            /* Handle JS types separately */
            if (t == jsManagerIndex) {
                const comp =
                    _WL._components[_wl_get_js_component_index_for_id(componentId)];
                if (componentType === null || comp.type == type) components.push(comp);
                continue;
            }

            if (componentType === null) {
                const managerName = $Object._typeNameFor(t);
                components.push(_wrapComponent(managerName, t, componentId));
            } else if (t == componentType) {
                /* Optimized manager name retrieval, already have type */
                components.push(_wrapComponent(type as string, componentType, componentId));
            }
        }
        return components;
    }

    /**
     * Add component of given type to the object.
     *
     * You can use this function to clone components, see the example below.
     *
     * ```js
     *  // Clone existing component (since 0.8.10)
     *  let original = this.object.getComponent('mesh');
     *  otherObject.addComponent('mesh', original);
     *  // Create component from parameters
     *  this.object.addComponent('mesh', {
     *      mesh: someMesh,
     *      material: someMaterial,
     *  });
     * ```
     *
     * @param typeOrClass Typename to create a component of. Can be native or
     *     custom JavaScript component type. It's also possible to give a class definition.
     *     In this case, the method will use the `class.TypeName` field.
     * @param params Parameters to initialize properties of the new component,
     *      can be another component to copy properties from.
     *
     * @returns {?(Component|CollisionComponent|TextComponent|ViewComponent|MeshComponent|InputComponent|LightComponent|AnimationComponent|PhysXComponent)} The component or {@link null} if the type was not found
     */
    addComponent<T extends Component>(
        typeOrClass: ComponentConstructor<T> | string,
        params: Record<string, any>
    ) {
        const type = isString(typeOrClass)
            ? (typeOrClass as string)
            : (typeOrClass as ComponentConstructor<T>).TypeName;
        const componentType = $Object._typeIndexFor(type);
        let component = null;
        let componentIndex = null;
        if (componentType < 0) {
            /* JavaScript component */
            if (!(type in _WL._componentTypeIndices)) {
                throw new TypeError("Unknown component type '" + type + "'");
            }
            const componentId = _wl_object_add_js_component(
                this.objectId,
                _WL._componentTypeIndices[type]
            );
            componentIndex = _wl_get_js_component_index_for_id(componentId);
            component = _WL._components[componentIndex];
        } else {
            /* native component */
            const componentId = _wl_object_add_component(this.objectId, componentType);
            component = _wrapComponent(type, componentType, componentId);
        }

        if (params !== undefined) {
            for (const key in params) {
                /* active will be set later, other properties should be skipped if
                 * passing a component for cloning. */
                if (EXCLUDED_COMPONENT_PROPERTIES.includes(key)) continue;
                component[key] = params[key];
            }
        }

        /* Explicitly initialize native components */
        if (componentType < 0) {
            /* @todo: `componentIndex` can be null here, that's an error */
            _wljs_component_init(componentIndex!);
            /* start() is called through onActivate() */
        }

        /* If it was not explicitly requested by the user to leave the component inactive,
         * we activate it as a final step. This invalidates componentIndex! */
        if (!params || !('active' in params && !params.active)) {
            component.active = true;
        }

        return component;
    }

    /**
     * Whether given object's transformation has changed.
     */
    get changed(): boolean {
        return !!_wl_object_is_changed(this.objectId);
    }

    /**
     * Checks equality by comparing whether the wrapped native component ids
     * and component manager types are equal.
     *
     * @param otherObject Object to check equality with.
     * @returns Whether this object equals the given object.
     */
    equals(otherObject?: $Object): boolean {
        if (!otherObject) return false;
        return this.objectId == otherObject.objectId;
    }

    /**
     * Used internally.
     *
     * @param type The type
     * @return The component type
     */
    static _typeIndexFor(type: string): number {
        const lengthBytes = lengthBytesUTF8(type) + 1;
        const mem = _malloc(lengthBytes);
        stringToUTF8(type, mem, lengthBytes);
        const componentType = _wl_get_component_manager_index(mem);
        _free(mem);

        return componentType;
    }

    /**
     * Used internally.
     *
     * @param typeIndex The type index
     * @return The name as a string
     */
    static _typeNameFor(typeIndex: number) {
        return UTF8ToString(_wl_component_manager_name(typeIndex));
    }
}

/**
 * Wrapper around a native skin data.
 */
export class Skin {
    /**
     * Index of the skin in the manager.
     * @hidden
     */
    public _index: number;

    constructor(index: number) {
        this._index = index;
    }

    /** Amount of joints in this skin. */
    get jointCount() {
        return _wl_skin_get_joint_count(this._index);
    }

    /** Joints object ids for this skin */
    get jointIds(): Uint16Array {
        return new Uint16Array(
            HEAPU16.buffer,
            _wl_skin_joint_ids(this._index),
            this.jointCount
        );
    }

    /**
     * Dual quaternions in a flat array of size 8 times {@link jointCount}.
     *
     * Inverse bind transforms of the skin.
     */
    get inverseBindTransforms(): Float32Array {
        return new Float32Array(
            HEAPF32.buffer,
            _wl_skin_inverse_bind_transforms(this._index),
            8 * this.jointCount
        );
    }

    /**
     * Vectors in a flat array of size 3 times {@link jointCount}.
     *
     * Inverse bind scalings of the skin.
     */
    get inverseBindScalings(): Float32Array {
        return new Float32Array(
            HEAPF32.buffer,
            _wl_skin_inverse_bind_scalings(this._index),
            3 * this.jointCount
        );
    }
}

/* Unfortunately, the name "Object" is reserved, so internally we
 * use $Object, while we expose WL.Object as previously. */
export {$Object as Object};

/**
 * Ray hit.
 *
 * Result of a {@link Scene.rayCast}.
 *
 * @note this class wraps internal engine data and should only be created internally.
 */
export class RayHit {
    /** Pointer to the memory heap. */
    private _ptr: number;

    /**
     * @param ptr Pointer to the ray hits memory.
     */
    constructor(ptr: number) {
        assert((ptr & 3) == 0, MISALIGNED_MSG);
        this._ptr = ptr;
    }

    /** Array of ray hit locations. */
    get locations(): Float32Array[] {
        let p = this._ptr;
        let l = [];
        for (let i = 0; i < this.hitCount; ++i) {
            l.push(new Float32Array(HEAPF32.buffer, p + 12 * i, 3));
        }
        return l;
    }

    /** Array of ray hit normals (only when using {@link Physics#rayCast}. */
    get normals(): Float32Array[] {
        let p = this._ptr + 48;
        let l = [];
        for (let i = 0; i < this.hitCount; ++i) {
            l.push(new Float32Array(HEAPF32.buffer, p + 12 * i, 3));
        }
        return l;
    }

    /**
     * Prefer these to recalculating the distance from locations.
     *
     * Distances of array hits to ray origin.
     */
    get distances(): Float32Array {
        const p = this._ptr + 48 * 2;
        return new Float32Array(HEAPF32.buffer, p, this.hitCount);
    }

    /** Hit objects */
    get objects(): ($Object | null)[] {
        let p = this._ptr + (48 * 2 + 16);
        let objIds = new Uint16Array(HEAPU16.buffer, p, this.hitCount);
        return [
            objIds[0] <= 0 ? null : _wrapObject(objIds[0]),
            objIds[1] <= 0 ? null : _wrapObject(objIds[1]),
            objIds[2] <= 0 ? null : _wrapObject(objIds[2]),
            objIds[3] <= 0 ? null : _wrapObject(objIds[3]),
        ];
    }

    /** Number of hits (max 4) */
    get hitCount(): number {
        return Math.min(HEAPU32[this._ptr / 4 + 30], 4);
    }
}

class math {
    /** (Experimental!) Cubic Hermite spline interpolation for vector3 and quaternions.
     *
     * With `f == 0`, `out` will be `b`, if `f == 1`, `out` will be c.
     *
     * Whether a quaternion or vector3 interpolation is intended is determined by
     * length of `a`.
     *
     * @param out Array to write result to.
     * @param a First tangent/handle.
     * @param b First point or quaternion.
     * @param c Second point or quaternion.
     * @param d Second handle.
     * @param f Interpolation factor in [0; 1].
     * @returns The `out` parameter.
     *
     * @since 0.8.6
     */
    static cubicHermite<T extends NumberArray>(
        out: T,
        a: Readonly<NumberArray>,
        b: Readonly<NumberArray>,
        c: Readonly<NumberArray>,
        d: Readonly<NumberArray>,
        f: number
    ) {
        _tempMemFloat.subarray(0).set(a);
        _tempMemFloat.subarray(4).set(b);
        _tempMemFloat.subarray(8).set(c);
        _tempMemFloat.subarray(12).set(d);

        const isQuat = a.length == 4;

        _wl_math_cubicHermite(
            _tempMem + 4 * 16,
            _tempMem + 4 * 0,
            _tempMem + 4 * 4,
            _tempMem + 4 * 8,
            _tempMem + 4 * 12,
            f,
            isQuat
        );
        out[0] = _tempMemFloat[16];
        out[1] = _tempMemFloat[17];
        out[2] = _tempMemFloat[18];
        if (isQuat) out[3] = _tempMemFloat[19];
        return out;
    }
}

export {math};

/**
 * Check if a given value is a native string or a `String` instance.
 *
 * @param value The value to check.
 * @returns `true` if the `value` has type string literal or `String`, `false` otherwise.
 */
export function isString(value: unknown) {
    return value && (typeof value === 'string' || value.constructor === String);
}

/**
 * @param objectId Object ID to wrap
 *
 * @returns Wrapped object
 * @note This is used for internal purposes
 *
 * @hidden
 */
export function _wrapObject(objectId: number): $Object {
    const o = ObjectCache[objectId] || (ObjectCache[objectId] = new $Object(objectId));
    o.objectId = objectId;
    return o;
}

/**
 * Retrieves a component instance if it exists, or create and cache
 * a new one.
 *
 * @param type component type name
 * @param {number} componentType Component manager index
 * @param {number} componentId Component id in the manager
 *
 * @returns JavaScript instance wrapping the native component
 *
 * @hidden
 */
export function _wrapComponent(type: string, componentType: number, componentId: number) {
    if (componentId < 0) return null;

    /* @todo: extremely slow in JS to do that... Better to use a Map or allocate the array. */
    const c = ComponentCache[componentType] || (ComponentCache[componentType] = []);
    if (c[componentId]) {
        return c[componentId];
    }

    let component;
    if (type == 'collision') {
        component = new CollisionComponent(componentType, componentId);
    } else if (type == 'text') {
        component = new TextComponent(componentType, componentId);
    } else if (type == 'view') {
        component = new ViewComponent(componentType, componentId);
    } else if (type == 'mesh') {
        component = new MeshComponent(componentType, componentId);
    } else if (type == 'input') {
        component = new InputComponent(componentType, componentId);
    } else if (type == 'light') {
        component = new LightComponent(componentType, componentId);
    } else if (type == 'animation') {
        component = new AnimationComponent(componentType, componentId);
    } else if (type == 'physx') {
        component = new PhysXComponent(componentType, componentId);
    } else {
        const typeIndex = _WL._componentTypeIndices[type];
        const constructor = _WL._componentTypes[typeIndex];
        component = new constructor();
    }
    /* Sets the manager and identifier from the outside, to
     * simplify the user's constructor. */
    component._manager = componentType;
    component._id = componentId;
    c[componentId] = component;
    return component;
}