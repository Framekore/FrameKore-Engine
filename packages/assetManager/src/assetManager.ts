import { definePlugin, Engine } from "@framekore/core";

/**
 * Creates the AssetManager plugin for the FrameKore Engine.
 *
 * When registered with `engine.use()`, this plugin instantiates an
 * {@link AssetManager} and stores it as an engine resource, making it
 * globally accessible via `AssetManager.get(engine)`.
 *
 * @returns An `EnginePlugin` definition to be passed to `engine.use()`.
 *
 * @example
 * import { assetManager, AssetManager } from "@framekore/asset-manager";
 *
 * engine.use(assetManager());
 *
 * // Pre-load assets during setup:
 * const assets = AssetManager.get(engine);
 * await assets.load("player", "image", "./assets/player.png");
 * await assets.load("bgm",    "audio", "./assets/music.ogg");
 * await assets.load("level",  "json",  "./assets/level1.json");
 */
export const assetManager = definePlugin(() => {
    return {
        name: "assetManager",
        setup(engine) {
            const manager = new AssetManager()
            engine.setResource(AssetManager, manager)
        },

    }
})

/**
 * Discriminated union of the supported asset type identifiers.
 *
 * | Value     | Loaded as              |
 * |-----------|------------------------|
 * | `"image"` | `HTMLImageElement`     |
 * | `"audio"` | `HTMLAudioElement`     |
 * | `"json"`  | `any` (parsed object)  |
 */
type AssetType = 'image' | 'audio' | 'json'

/**
 * Maps each {@link AssetType} literal to the concrete TypeScript type that
 * {@link AssetManager.load} resolves to.
 *
 * This mapping enables the generic `load<K>()` overload to infer the correct
 * return type from the `type` argument without any manual casting at the
 * call-site.
 *
 * @example
 * // TypeScript infers the return type as HTMLImageElement automatically:
 * const img = await manager.load("hero", "image", "./hero.png");
 * //    ^? HTMLImageElement
 */
type AssetMap = {
    image: HTMLImageElement,
    audio: HTMLAudioElement,
    json: any
}

/**
 * Loads, caches, and provides synchronous access to game assets such as
 * images, audio files, and JSON data.
 *
 * ## How caching works
 * The first call to `load(key, type, src)` starts an async fetch and
 * immediately stores the pending `Promise` under `key` in the internal cache.
 * Any subsequent call for the same `key` while the first is still in-flight
 * will `await` the same `Promise` — preventing duplicate network requests.
 * Once the asset resolves, the cache entry is replaced with the concrete
 * asset value so that {@link get} can return it synchronously.
 *
 * ## Usage
 * Register the plugin once, then retrieve the manager wherever you need it:
 *
 * ```ts
 * engine.use(assetManager());
 *
 * const assets = AssetManager.get(engine);
 *
 * // During setup — await all required assets before the game starts:
 * await assets.load("tileset", "image", "./assets/tileset.png");
 *
 * // During runtime — retrieve synchronously (must have been loaded first):
 * const tileset = assets.get<HTMLImageElement>("tileset");
 * ctx.drawImage(tileset, x, y);
 * ```
 */
export class AssetManager {
    /**
     * Internal cache that stores either a pending `Promise` (while loading)
     * or the resolved asset value (after loading completes).
     *
     * Using `unknown` here keeps the cache type-safe at the storage level
     * while the public API provides typed access via generics.
     */
    #cache = new Map<string, unknown>()

    /**
     * Loads an asset from the given URL and stores it in the internal cache.
     *
     * If the `key` is already present in the cache (either as a pending
     * `Promise` or as a resolved asset), the cached value is returned
     * immediately — no additional network request is made.
     *
     * Supported asset types and their resolved element types:
     * - `"image"` → `HTMLImageElement` (loaded via `new Image()`)
     * - `"audio"` → `HTMLAudioElement` (loaded via `new Audio()`)
     * - `"json"`  → `any`             (loaded via `fetch` + `res.json()`)
     *
     * @typeParam K - An {@link AssetType} literal (`"image"`, `"audio"`, or `"json"`).
     * @param key  - A unique string identifier used to store and retrieve the asset.
     * @param type - The type of asset to load. Determines the loader and the return type.
     * @param src  - The URL or path of the asset to load. Accepts a plain `string` or a `URL` object.
     * @returns A `Promise` that resolves to the loaded asset typed via {@link AssetMap}.
     * @throws {Error} If an unsupported `type` is provided.
     * @throws {Error} If loading the asset fails (network error, 404, decode failure, etc.).
     *
     * @example
     * const assets = AssetManager.get(engine);
     *
     * // Load an image
     * const sprite = await assets.load("hero", "image", "./assets/hero.png");
     * //    ^? HTMLImageElement
     *
     * // Load audio
     * const sfx = await assets.load("jump", "audio", "./assets/jump.ogg");
     * //    ^? HTMLAudioElement
     *
     * // Load JSON map data
     * const map = await assets.load("level1", "json", "./maps/level1.json");
     * //    ^? any
     */
    async load<K extends AssetType>(
        key: string,
        type: K,
        src: string | URL
    ): Promise<AssetMap[K]> {
        if (this.#cache.has(key)) {
            return await this.#cache.get(key) as AssetMap[K];
        }

        const url = typeof src === "string" ? src : src.toString();

        const promise = (async (): Promise<AssetMap[K]> => {
            switch (type) {
                case "image":
                    return await this.#loadImage(url) as AssetMap[K];

                case "audio":
                    return await this.#loadAudio(url) as AssetMap[K];

                case "json":
                    return await this.#loadJSON(url) as AssetMap[K];

                default:
                    throw new Error(`Unsupported asset type: ${type}`);
            }
        })();

        this.#cache.set(key, promise);

        const asset = await promise;
        this.#cache.set(key, asset);

        return asset;
    }

    /**
     * Retrieves the active `AssetManager` instance registered with the given engine.
     *
     * This is the recommended way to access the `AssetManager` from any
     * part of your game code (game objects, systems, scene setup, etc.).
     *
     * @param engine - The `Engine` instance to retrieve the resource from.
     * @returns The `AssetManager` instance stored in the engine's resource map.
     * @throws {Error} If {@link assetManager} plugin has not been registered with the engine.
     *
     * @example
     * const assets = AssetManager.get(engine);
     * await assets.load("tileset", "image", "./assets/tileset.png");
     */
    static get(engine: Engine): AssetManager {
        const manager = engine.getResource(AssetManager)
        if (!manager)
            throw new Error("AssetManager has not been added to the Engine.")
        return manager
    }

    /**
     * Synchronously retrieves a previously loaded asset from the cache.
     *
     * The asset **must** have been fully loaded via {@link load} before calling
     * this method. Attempting to retrieve an asset that is still loading or
     * was never requested will throw.
     *
     * The generic parameter `T` lets you assert the expected element type
     * at the call-site. No runtime type checking is performed.
     *
     * @typeParam T - The expected type of the cached asset.
     * @param key - The unique string identifier used when the asset was loaded.
     * @returns The cached asset cast to type `T`.
     * @throws {Error} If no asset is found in the cache under the given `key`.
     *
     * @example
     * // After load("playerSprite", "image", ...) has resolved:
     * const img = assets.get<HTMLImageElement>("playerSprite");
     * ctx.drawImage(img, x, y);
     */
    get<T>(key: string): T {
        const asset = this.#cache.get(key)
        if (!asset) {
            throw new Error(`Asset "${key}" not found in cache.`)
        }
        return asset as T
    }

    /**
     * Removes a single asset from the cache, freeing the reference.
     *
     * After calling this, a subsequent `get(key)` will throw until the asset
     * is re-loaded via `load()`.
     *
     * @param key - The unique string identifier of the asset to remove.
     *
     * @example
     * // Unload a level's assets when transitioning to the next scene:
     * assets.remove("level1Tileset");
     * assets.remove("level1Music");
     */
    remove(key: string): void {
        this.#cache.delete(key)
    }

    /**
     * Clears **all** assets from the cache.
     *
     * Use this when transitioning between scenes or levels and you want to
     * release all previously loaded resources.
     *
     * @example
     * // On scene exit — free everything before loading the next scene:
     * assets.clear();
     */
    clear(): void {
        this.#cache.clear()
    }


    /**
     * Internal loader for `"image"` assets.
     *
     * Creates a new `HTMLImageElement`, assigns its `src`, and wraps the
     * `onload`/`onerror` callbacks in a `Promise`.
     *
     * @param src - The URL of the image to load.
     * @returns A `Promise` that resolves with the loaded `HTMLImageElement`.
     * @internal
     */
    #loadImage(src: string): Promise<HTMLImageElement> {
        console.log(src);
        
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.src = src
            img.onload = () => resolve(img)
            img.onerror = reject
        })
    }

    /**
     * Internal loader for `"audio"` assets.
     *
     * Creates a new `HTMLAudioElement` with the given `src` and resolves
     * once the browser has loaded enough data to play the audio.
     *
     * @param src - The URL of the audio file to load.
     * @returns A `Promise` that resolves with the loaded `HTMLAudioElement`.
     * @internal
     */
    #loadAudio(src: string): Promise<HTMLAudioElement> {
        return new Promise((resolve, reject) => {
            const audio = new Audio(src)
            audio.onloadeddata = () => resolve(audio)
            audio.onerror = reject
        })
    }

    /**
     * Internal loader for `"json"` assets.
     *
     * Uses the Fetch API to retrieve the resource and parses the response
     * body as JSON.
     *
     * @param src - The URL of the JSON file to fetch.
     * @returns A `Promise` that resolves with the parsed JSON value.
     * @throws {Error} If the HTTP response status is not `ok` (e.g. 404, 500).
     * @internal
     */
    async #loadJSON(src: string): Promise<any> {
        const res = await fetch(src)
        if (!res.ok) {
            throw new Error(`Error loading JSON: ${src}`)
        }
        return res.json()
    }

}