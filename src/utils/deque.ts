export class Deque<T> {
    private deque: T[] = new Array();

    get length() { return this.deque.length; }

    pushBack(t: T) {
        this.deque.push(t);
    }

    pushFront(t: T) {
        this.deque.unshift(t);
    }

    popBack() {
        if (this.deque.length > 0) {
            return this.deque.pop() as T;
        }
        return null;
    }

    popFront() {
        if (this.deque.length > 0) {
            return this.deque.shift() as T
        }

        return null;
    }

    isEmpty() {
        return this.deque.length === 0;
    }
}
