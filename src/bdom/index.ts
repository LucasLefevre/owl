export { createBlock } from "./block";
export { list } from "./list";
export { multi } from "./multi";
export { text } from "./text";
export { html } from "./html";

export interface BNode<T = any> {
  mount(parent: HTMLElement, afterNode: Node | null): void;
  moveBefore(other: T | null, afterNode: Node | null): void;
  patch(other: T): void;
  remove(): void;
  firstNode(): Node | undefined;

  el?: undefined | HTMLElement | Text;
  parentEl?: undefined | HTMLElement;
  singleNode?: boolean | undefined;
  key?: any;
}

export function mount(bnode: BNode, fixture: HTMLElement) {
  bnode.mount(fixture, null);
}

export function patch(block1: BNode, block2: BNode) {
  block1.patch(block2);
}

