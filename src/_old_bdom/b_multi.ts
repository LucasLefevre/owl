import { Block, removeBlock } from "./block";

// -----------------------------------------------------------------------------
//  Multi Block
// -----------------------------------------------------------------------------

export class BMulti implements Block<BMulti> {
  children: (Block | undefined | null)[];
  anchors?: ChildNode[];
  el: ChildNode | null = null;

  constructor(n: number) {
    this.children = new Array(n);
    this.anchors = new Array(n);
  }

  firstChildNode(): ChildNode | null {
    for (let child of this.children) {
      if (child) {
        return child.firstChildNode();
      }
    }
    return null;
  }

  mountBefore(anchor: ChildNode) {
    const children = this.children;
    const anchors = this.anchors;
    for (let i = 0, l = children.length; i < l; i++) {
      let child: any = children[i];
      const childAnchor = document.createTextNode("");
      anchor.before(childAnchor);
      anchors![i] = childAnchor;
      if (child) {
        child.mountBefore(childAnchor);
      }
    }
  }

  moveBefore(anchor: ChildNode) {
    for (let i = 0; i < this.children.length; i++) {
      let child: any = this.children[i];
      const childAnchor = document.createTextNode("");
      anchor.before(childAnchor);
      this.anchors![i] = childAnchor;
      if (child) {
        child.moveBefore(childAnchor);
      }
    }
  }

  patch(newTree: BMulti) {
    const children = this.children;
    const newChildren = newTree.children;
    const anchors = this.anchors!;
    for (let i = 0, l = children.length; i < l; i++) {
      const block = children[i];
      const newBlock = newChildren[i];
      if (block) {
        if (newBlock) {
          block.patch(newBlock);
        } else {
          children[i] = null;
          removeBlock(block);
        }
      } else if (newBlock) {
        children[i] = newBlock;
        newBlock.mountBefore(anchors[i]);
      }
    }
  }

  beforeRemove() {
    for (let child of this.children) {
      if (child) {
        child.beforeRemove();
      }
    }
  }

  remove() {
    const children = this.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child) {
        child.remove();
      }
      this.anchors![i].remove();
    }
  }

  toString(): string {
    return this.children.map((c) => (c ? c.toString() : "")).join("");
  }
}
