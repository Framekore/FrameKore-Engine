/**
 * Comparator function used to determine the order of elements in the PriorityQueue.
 * Should return a negative number if `a` should come before `b`, positive if `b` should come before `a`, or 0 if they are equal.
 */
type Comparator<T> = (a: T, b: T) => number;

/**
 * A Priority Queue implementation using a Min-Heap.
 * Items are ordered based on the provided comparator function.
 */
export class PriorityQueue<T> implements Iterable<T> {
    private heap: T[] = [];
    private compare: Comparator<T>;

    /**
     * Creates a new PriorityQueue.
     * @param compare - Optional comparator function. Defaults to numerical ascending order (a - b).
     * @example
     * const pq = new PriorityQueue<number>();
     * const pqDesc = new PriorityQueue<number>((a, b) => b - a);
     */
    constructor(compare?: Comparator<T>) {
        this.compare = compare ?? ((a: any, b: any) => a - b);
    }

    /**
     * Gets the number of elements currently in the queue.
     * @returns The size of the queue.
     */
    size(): number {
        return this.heap.length;
    }

    /**
     * Checks if the queue has no elements.
     * @returns True if the queue is empty, false otherwise.
     */
    isEmpty(): boolean {
        return this.heap.length === 0;
    }

    /**
     * Returns the element with the highest priority without removing it.
     * @returns The top element, or undefined if the queue is empty.
     */
    peek(): T | undefined {
        return this.heap[0];
    }

    /**
     * Adds a new element to the queue and reorders it to maintain priority.
     * @param value - The item to add.
     * @example
     * pq.enqueue(5);
     */
    enqueue(value: T): void {
        this.heap.push(value);
        this.heapifyUp();
    }

    /**
     * Removes and returns the element with the highest priority.
     * @returns The removed top element, or undefined if the queue is empty.
     * @example
     * const top = pq.dequeue();
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
     * Removes a specific element from the queue.
     * @param value - The value to remove.
     * @returns True if the value was found and removed, false otherwise.
     * @example
     * pq.delete(targetValue);
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
     * Iterator that traverses the heap without consuming items.
     * The order of iteration is not strictly sorted, but it contains all elements.
     * @returns An Iterator for the items in the queue.
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

    private heapifyUp(): void {
        this.heapifyUpFrom(this.heap.length - 1);
    }

    private heapifyUpFrom(index: number): void {
        while (index > 0) {
            const parentIndex = this.parent(index);
            if (this.compare(this.heap[index], this.heap[parentIndex]) >= 0) break;
            this.swap(index, parentIndex);
            index = parentIndex;
        }
    }

    private heapifyDown(): void {
        this.heapifyDownFrom(0);
    }

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

    private parent(i: number): number {
        return Math.floor((i - 1) / 2);
    }

    private left(i: number): number {
        return 2 * i + 1;
    }

    private right(i: number): number {
        return 2 * i + 2;
    }

    private swap(i: number, j: number): void {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }
}
