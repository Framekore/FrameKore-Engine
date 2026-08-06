import { definePlugin, Engine } from "@framekore/core";

/**
 * Creates an AssetManager plugin for the Engine.
 * Registers the AssetManager to handle loading and caching resources.
 * @returns An EnginePlugin definition to be passed to `engine.use()`.
 * @example
 * engine.use(assetManager());
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

/** Valid asset types for the manager. */
type AssetType = 'image' | 'audio' | 'json'

/** Maps AssetType to its corresponding return HTML/Native element type. */
type AssetMap = {
    image: HTMLImageElement,
    audio: HTMLAudioElement,
    json: any
}

/**
 * Manages loading, caching, and retrieving game assets like images, audio, and JSON files.
 */
export class AssetManager {
    #cache = new Map<string, unknown>()

    /**
     * Loads an asset from a URL and caches it. If the asset is already loading or loaded, it returns the cached promise/asset.
     * @param key - A unique string identifier to cache the asset under.
     * @param type - The type of asset being loaded ('image', 'audio', or 'json').
     * @param src - The URL or path to the asset.
     * @returns A Promise that resolves to the loaded asset.
     * @example
     * const manager = AssetManager.get(engine);
     * await manager.load("playerSprite", "image", "./assets/player.png");
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
     * Retrieves the active AssetManager instance from an Engine.
     * @param engine - The Engine instance.
     * @returns The AssetManager instance.
     * @throws If the AssetManager has not been added to the Engine via the plugin.
     * @example
     * const manager = AssetManager.get(engine);
     */
    static get(engine: Engine): AssetManager {
        const manager = engine.getResource(AssetManager)
        if (!manager)
            throw new Error("AssetManager has not been added to the Engine.")
        return manager
    }

    /**
     * Retrieves a previously loaded and cached asset synchronously.
     * @param key - The unique string identifier of the asset.
     * @returns The loaded asset casted to type T.
     * @throws If the asset is not found in the cache.
     * @example
     * const img = manager.get<HTMLImageElement>("playerSprite");
     */
    get<T>(key: string): T {
        const asset = this.#cache.get(key)
        if (!asset) {
            throw new Error(`Asset "${key}" not found in cache.`)
        }
        return asset as T
    }

    /**
     * Removes an asset from the cache.
     * @param key - The unique string identifier of the asset.
     * @example manager.remove("playerSprite");
     */
    remove(key: string): void {
        this.#cache.delete(key)
    }

    /**
     * Clears all loaded assets from the cache.
     * @example manager.clear();
     */
    clear(): void {
        this.#cache.clear()
    }


    #loadImage(src: string): Promise<HTMLImageElement> {
        console.log(src);
        
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.src = src
            img.onload = () => resolve(img)
            img.onerror = reject
        })
    }

    #loadAudio(src: string): Promise<HTMLAudioElement> {
        return new Promise((resolve, reject) => {
            const audio = new Audio(src)
            audio.onloadeddata = () => resolve(audio)
            audio.onerror = reject
        })
    }
    
    async #loadJSON(src: string): Promise<any> {
        const res = await fetch(src)
        if (!res.ok) {
            throw new Error(`Error loading JSON: ${src}`)
        }
        return res.json()
    }

}