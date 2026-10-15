/**
 * A binary comparator function used to establish ordering in a {@link PriorityQueue}.
 *
 * - Return a **negative** number if `a` should be dequeued before `b` (higher priority).
 * - Return a **positive** number if `b` should be dequeued before `a`.
 * - Return `0` if `a` and `b` have equal priority.
 *
 * @typeParam T - The element type stored in the queue.
 *
 * @example
 * // Ascending numeric order (min-heap, default)
 * const asc: Comparator<number> = (a, b) => a - b;
 *
 * // Descending numeric order (max-heap)
 * const desc: Comparator<number> = (a, b) => b - a;
 *
 * // Object ordering by a `priority` field
 * const byPriority: Comparator<{ priority: number }> = (a, b) => a.priority - b.priority;
 */
type Comparator<T> = (a: T, b: T) => number;

/**
 * A generic min-heap priority queue.
 *
 * Elements are stored in a binary min-heap and ordered according to the
 * {@link Comparator} supplied at construction time. The element with the
 * lowest comparator value (highest priority) is always at the front.
 *
 * Used internally by {@link Ticker} to maintain ordered listener queues for
 * the `UPDATE`, `FIXED_UPDATE`, and `RENDER` phases, ensuring callbacks run
 * in the correct sequence regardless of registration order.
 *
 * ### Complexity
 * | Operation      | Average    | Worst-case |
 * |----------------|------------|------------|
 * | `enqueue`      | O(log n)   | O(log n)   |
 * | `dequeue`      | O(log n)   | O(log n)   |
 * | `peek`         | O(1)       | O(1)       |
 * | `delete`       | O(n)       | O(n)       |
 * | `[Symbol.iterator]` | O(n) | O(n)       |
 *
 * @typeParam T - The type of elements stored in the queue.
 *
 * @example
 * // Min-heap of numbers (default comparator)
 * const pq = new PriorityQueue<number>();
 * pq.enqueue(10);
 * pq.enqueue(3);
 * pq.enqueue(7);
 * console.log(pq.dequeue()); // 3
 *
 * @example
 * // Custom comparator — objects ordered by a `priority` field
 * const pq = new PriorityQueue<{ name: string; priority: number }>(
 *   (a, b) => a.priority - b.priority
 * );
 * pq.enqueue({ name: 'render', priority: 10000 });
 * pq.enqueue({ name: 'update', priority: 1000  });
 * console.log(pq.peek()?.name); // 'update'
 */
export class PriorityQueue<T> implements Iterable<T> {
    /**
     * The underlying heap array. Index `0` always holds the highest-priority
     * (minimum comparator value) element.
     * @internal
     */
    private heap: T[] = [];

    /**
     * The comparator function used to determine element ordering.
     * Injected at construction time; defaults to ascending numeric subtraction.
     * @internal
     */
    private compare: Comparator<T>;

    /**
     * Creates a new `PriorityQueue`.
     *
     * @param compare - Optional comparator. Defaults to `(a, b) => a - b`
     *                  (ascending numeric order, suitable for number queues).
     *                  Supply a custom comparator to queue objects or use
     *                  descending order.
     *
     * @example
     * // Default (ascending numbers)
     * const pq = new PriorityQueue<number>();
     *
     * // Descending numbers (max-heap)
     * const maxPq = new PriorityQueue<number>((a, b) => b - a);
     *
     * // Listener objects ordered by their priority field
     * const listenerQueue = new PriorityQueue<Listener>(
     *   (a, b) => a.priority - b.priority
     * );
     */
    constructor(compare?: Comparator<T>) {
        this.compare = compare ?? ((a: any, b: any) => a - b);
    }

    /**
     * Returns the number of elements currently in the queue.
     *
     * @returns The count of elements, or `0` if the queue is empty.
     *
     * @example
     * pq.enqueue(1);
     * pq.enqueue(2);
     * console.log(pq.size()); // 2
     */
    size(): number {
        return this.heap.length;
    }

    /**
     * Checks whether the queue contains no elements.
     *
     * @returns `true` if the queue is empty, `false` otherwise.
     *
     * @example
     * const pq = new PriorityQueue<number>();
     * console.log(pq.isEmpty()); // true
     * pq.enqueue(42);
     * console.log(pq.isEmpty()); // false
     */
    isEmpty(): boolean {
        return this.heap.length === 0;
    }

    /**
     * Inspects the highest-priority element without removing it from the queue.
     *
     * @returns The element at the front of the queue, or `undefined` if empty.
     *
     * @example
     * pq.enqueue(5);
     * pq.enqueue(1);
     * console.log(pq.peek()); // 1  (lowest number = highest priority)
     */
    peek(): T | undefined {
        return this.heap[0];
    }

    /**
     * Inserts a new element into the queue and restores heap order by
     * bubbling the element up from the tail.
     *
     * @param value - The element to insert.
     *
     * @example
     * pq.enqueue(42);
     * pq.enqueue(7);
     * pq.enqueue(99);
     * console.log(pq.peek()); // 7
     */
    enqueue(value: T): void {
        this.heap.push(value);
        this.heapifyUp();
    }

    /**
     * Removes and returns the highest-priority element (the root of the heap).
     *
     * After removal the last element is placed at the root and sifted down to
     * restore heap order in O(log n).
     *
     * @returns The removed element, or `undefined` if the queue is empty.
     *
     * @example
     * pq.enqueue(3);
     * pq.enqueue(1);
     * pq.enqueue(2);
     * console.log(pq.dequeue()); // 1
     * console.log(pq.dequeue()); // 2
     * console.log(pq.dequeue()); // 3
     */
    dequeue(): T | undefined {
        if (this.isEmpty()) return undefined;

        const root = this.heap[0];
        const last = this.heap.pop()!;

        if (!this.isEmpty()) {
            this.heap[0] = last;
            this.heapifyDown();
        }

        return root;
    }

    /**
     * Removes a specific element from the queue by reference equality (`===`).
     *
     * After the element is found and removed, the displaced tail element is
     * placed in the vacated slot and the heap is re-balanced in O(log n).
     * The overall operation is O(n) due to the linear search.
     *
     * @param value - The element to remove. Must be the exact same reference
     *                as the one passed to {@link enqueue}.
     * @returns `true` if the element was found and removed; `false` otherwise.
     *
     * @example
     * const task = { priority: 5, name: 'task' };
     * pq.enqueue(task);
     * pq.delete(task); // true
     * pq.delete(task); // false (already removed)
     */
    delete(value: T): boolean {
        const index = this.heap.findIndex(v => v === value);
        if (index === -1) return false;

        const last = this.heap.pop()!;

        if (index < this.heap.length) {
            this.heap[index] = last;

            const parentIndex = this.parent(index);
            if (index > 0 && this.compare(this.heap[index], this.heap[parentIndex]) < 0) {
                this.heapifyUpFrom(index);
            } else {
                this.heapifyDownFrom(index);
            }
        }

        return true;
    }

    /**
     * Makes `PriorityQueue` iterable via `for...of` loops.
     *
     * Iterates over a **snapshot** of the internal heap array taken at the
     * moment iteration begins. The iteration order reflects heap storage order,
     * which is not strictly sorted — only the first element is guaranteed to be
     * the minimum. Modifying the queue during iteration has no effect on the
     * snapshot.
     *
     * @returns An `Iterator<T>` over all current elements in heap order.
     *
     * @example
     * for (const listener of listenerQueue) {
     *   listener.f(delta);
     * }
     */
    [Symbol.iterator](): Iterator<T> {
        let index = 0;
        const snapshot = [...this.heap]; // copy to avoid consuming
        return {
            next: (): IteratorResult<T> => {
                if (index < snapshot.length) {
                    return { value: snapshot[index++], done: false };
                } else {
                    return { value: undefined, done: true };
                }
            }
        };
    }

    /**
     * Triggers an upward heapify pass starting from the last element.
     * Called after {@link enqueue} to restore heap order.
     * @internal
     */
    private heapifyUp(): void {
        this.heapifyUpFrom(this.heap.length - 1);
    }

    /**
     * Bubbles the element at `index` upward until it is in the correct heap
     * position (i.e., its comparator value is ≥ its parent's).
     *
     * @param index - The index to start the upward pass from.
     * @internal
     */
    private heapifyUpFrom(index: number): void {
        while (index > 0) {
            const parentIndex = this.parent(index);
            if (this.compare(this.heap[index], this.heap[parentIndex]) >= 0) break;
            this.swap(index, parentIndex);
            index = parentIndex;
        }
    }

    /**
     * Triggers a downward heapify pass starting from the root.
     * Called after {@link dequeue} to restore heap order.
     * @internal
     */
    private heapifyDown(): void {
        this.heapifyDownFrom(0);
    }

    /**
     * Sifts the element at `index` downward, swapping it with the smaller of
     * its two children until heap order is restored.
     *
     * @param index - The index to start the downward pass from.
     * @internal
     */
    private heapifyDownFrom(index: number): void {
        while (this.left(index) < this.heap.length) {
            let smallerChild = this.left(index);
            const right = this.right(index);

            if (
                right < this.heap.length &&
                this.compare(this.heap[right], this.heap[smallerChild]) < 0
            ) {
                smallerChild = right;
            }

            if (this.compare(this.heap[index], this.heap[smallerChild]) <= 0) break;

            this.swap(index, smallerChild);
            index = smallerChild;
        }
    }

    /**
     * Returns the heap index of the parent of node `i`.
     * @param i - A node index (0-based).
     * @returns The parent node index.
     * @internal
     */
    private parent(i: number): number {
        return Math.floor((i - 1) / 2);
    }

    /**
     * Returns the heap index of the left child of node `i`.
     * @param i - A node index (0-based).
     * @returns The left child index.
     * @internal
     */
    private left(i: number): number {
        return 2 * i + 1;
    }

    /**
     * Returns the heap index of the right child of node `i`.
     * @param i - A node index (0-based).
     * @returns The right child index.
     * @internal
     */
    private right(i: number): number {
        return 2 * i + 2;
    }

    /**
     * Swaps two elements in the heap array in-place.
     * @param i - Index of the first element.
     * @param j - Index of the second element.
     * @internal
     */
    private swap(i: number, j: number): void {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }
}
