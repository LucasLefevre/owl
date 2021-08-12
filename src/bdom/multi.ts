import type { BNode } from "./index";

const getDescriptor = (o: any, p: any) => Object.getOwnPropertyDescriptor(o, p)!;
const nodeProto = Node.prototype;
const nodeInsertBefore = nodeProto.insertBefore;
const nodeSetTextContent = getDescriptor(nodeProto, "textContent").set!;
const nodeRemoveChild = nodeProto.removeChild;

// -----------------------------------------------------------------------------
// Multi NODE
// -----------------------------------------------------------------------------

// TODO!!!!!
// todo:  either keep a child or a anchor, but not both
// and use same array!!!, and replacechild

class BNodeMulti {
  children: (BNode | undefined)[];
  anchors?: Node[] | undefined;
  parentEl?: HTMLElement | undefined;
  singleNode?: boolean | undefined;

  constructor(children: (BNode | undefined)[]) {
    this.children = children;
  }

  mount(parent: HTMLElement, afterNode: Node | null) {
    const children = this.children;
    const l = children.length;
    const anchors = new Array(l);
    for (let i = 0; i < l; i++) {
      const childAnchor = document.createTextNode("");
      anchors[i] = childAnchor;
      nodeInsertBefore.call(parent, childAnchor, afterNode);
      let child = children[i];
      if (child) {
        child.mount(parent, childAnchor);
      }
    }
    this.anchors = anchors;
    this.parentEl = parent;
  }

  moveBefore(other: BNodeMulti | null, afterNode: Node | null) {
    if (other) {
      const nextNode = other!.children[0];
      afterNode = (nextNode ? nextNode.firstNode() : other!.anchors![0]) || null;
    }
    const children = this.children;
    const parent = this.parentEl;
    const anchors = this.anchors;
    for (let i = 0, l = children.length; i < l; i++) {
      let child = children[i];
      const anchor = anchors![i];
      nodeInsertBefore.call(parent, anchor, afterNode);
      if (child) {
        child.moveBefore(null, anchor);
      }
    }
  }

  patch(other: BNodeMulti) {
    if (this === other) {
      return;
    }
    const children1 = this.children;
    const children2 = other.children;
    const anchors = this.anchors!;
    const parentEl = this.parentEl!;
    for (let i = 0, l = children1.length; i < l; i++) {
      const bnode1 = children1[i];
      const bnode2 = children2[i];
      if (bnode1) {
        if (bnode2) {
          bnode1.patch(bnode2);
        } else {
          bnode1.remove();
          children1[i] = undefined;
        }
      } else if (bnode2) {
        children1[i] = bnode2;
        bnode2.mount(parentEl, anchors[i]);
      }
    }
  }

  remove() {
    const parentEl = this.parentEl;
    if (this.singleNode) {
      nodeSetTextContent.call(parentEl, "");
    } else {
      const children = this.children;
      const anchors = this.anchors;
      const l = children.length;
      for (let i = 0; i < l; i++) {
        const child = children[i];
        if (child) {
          child.remove();
        }
        nodeRemoveChild.call(parentEl, anchors![i]);
      }
    }
  }

  firstNode(): Node | undefined {
    const child = this.children[0];
    return child ? child.firstNode() : this.anchors![0];
  }
}

export function multi(children: (BNode | undefined)[]): BNode<BNodeMulti> {
  return new BNodeMulti(children);
}
