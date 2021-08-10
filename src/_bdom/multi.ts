import { Anchor, Block } from "./types";

export interface BlockMulti extends Block<BlockMulti> {
  anchors: Anchor[] | undefined;
  blocks: (Block | undefined)[];
}

export function multi(blocks: (Block | undefined)[]): BlockMulti {
  return {
    mountBefore,
    patch,
    moveBefore,
    remove,
    firstChildNode,
    anchors: undefined,
    blocks,
  };
}

function mountBefore(this: BlockMulti, anchor: Anchor) {
  const children = this.blocks;
  const anchors = new Array(children.length);
  for (let i = 0, l = children.length; i < l; i++) {
    let child = children[i];
    const childAnchor = document.createTextNode("");
    anchor.before(childAnchor);
    anchors![i] = childAnchor;
    if (child) {
      child.mountBefore(childAnchor);
    }
  }
  this.anchors = anchors;
}

function patch(this: BlockMulti, block: BlockMulti) {
  if (this === block) {
    return;
  }
  const children = this.blocks;
  const newChildren = block.blocks!;
  const anchors = this.anchors!;
  for (let i = 0, l = children.length; i < l; i++) {
    const block = children[i];
    const newBlock = newChildren[i];
    if (block) {
      if (newBlock) {
        block.patch(newBlock);
      } else {
        children[i] = undefined;
        block.remove();
      }
    } else if (newBlock) {
      children[i] = newBlock;
      newBlock.mountBefore(anchors[i]);
    }
  }
}

function moveBefore(this: BlockMulti, anchor: any) {
  const children = this.blocks;
  const anchors = this.anchors!;
  for (let i = 0, l = children.length; i < l; i++) {
    let child = children[i];
    let _anchor = anchors[i];
    anchor.before(_anchor);
    if (child) {
      child.moveBefore(_anchor);
    }
  }
}

function remove(this: BlockMulti) {
  const children = this.blocks;
  const anchors = this.anchors;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child) {
      child.remove();
    }
    anchors![i].remove();
  }
}

function firstChildNode(this: BlockMulti): ChildNode | null {
  const children = this.blocks;
  for (let i = 0, l = children.length; i < l; i++) {
    const child = children[i];
    if (child) {
      return child.el || child.firstChildNode();
    }
  }
  return null;
}
