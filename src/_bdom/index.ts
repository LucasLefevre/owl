import { Block } from "./types";

export { makeBlock } from "./element";
export { list } from "./list";
export { multi } from "./multi";
export { text } from "./text";

// export function beforeRemove(block: Block) {}

// -----------------------------------------------------------------------------
//  BDom main entry points
// -----------------------------------------------------------------------------

export function mount(block: Block, target: HTMLElement) {
  const anchor = document.createTextNode("");
  target.appendChild(anchor);
  block.mountBefore(anchor);
  anchor.remove();
}

// todo: remove this?
export function patch(block1: Block, block2: Block) {
  block1.patch(block2);
}

// todo: remove this?
export function remove(block: Block) {
  // beforeRemove(block);
  block.remove();
}
