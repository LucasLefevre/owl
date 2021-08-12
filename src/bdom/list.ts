import type { BNode } from "./index";

const getDescriptor = (o: any, p: any) => Object.getOwnPropertyDescriptor(o, p)!;
const nodeProto = Node.prototype;

const nodeInsertBefore = nodeProto.insertBefore;
const nodeAppendChild = nodeProto.appendChild;
const nodeRemoveChild = nodeProto.removeChild;
const nodeSetTextContent = getDescriptor(nodeProto, "textContent").set!;

// -----------------------------------------------------------------------------
// List Node
// -----------------------------------------------------------------------------

class BNodeList {
  children: BNode[];
  anchor: Node | undefined;
  parentEl?: HTMLElement | undefined;
  singleNode?: boolean | undefined;

  constructor(children: BNode[]) {
    this.children = children;
  }

  mount(parent: HTMLElement, afterNode: Node | null) {
    const children = this.children;
    const _anchor = document.createTextNode("");
    this.anchor = _anchor;
    nodeInsertBefore.call(parent, _anchor, afterNode);
    const l = children.length;
    if (l) {
      const mount = children[0].mount;
      for (let i = 0; i < l; i++) {
        mount.call(children[i], parent, _anchor);
      }
    }

    this.parentEl = parent;
  }

  moveBefore(other: BNodeList | null, afterNode: Node | null) {
    // todo
  }

  patch(other: BNodeList) {
    if (this === other) {
      return;
    }
    const oldCh = this.children;
    const newCh: BNode[] = other.children;
    if (newCh.length === 0 && oldCh.length === 0) {
      return;
    }
    const proto = ((newCh[0] || oldCh[0]));
    const {mount: childMount, patch: childPatch, remove: childRemove} = proto;

    const _anchor = this.anchor!;
    const isOnlyChild = this.singleNode;
    const parent = _anchor.parentElement!;

    // fast path: no new child => only remove
    if (newCh.length === 0 && isOnlyChild) {
      // if (!data.hasNoComponent) {
      //   for (let i = 0; i < oldCh.length; i++) {
      //     beforeRemove(oldCh[i]);
      //   }
      // }

      nodeSetTextContent.call(parent, "");
      nodeAppendChild.call(parent, _anchor);
      this.children = newCh;
      return;
    }

    let oldStartIdx = 0;
    let newStartIdx = 0;
    let oldStartBlock = oldCh[0];
    let newStartBlock = newCh[0];

    let oldEndIdx = oldCh.length - 1;
    let newEndIdx = newCh.length - 1;
    let oldEndBlock = oldCh[oldEndIdx];
    let newEndBlock = newCh[newEndIdx];

    let mapping: any = undefined;
    // let noFullRemove = this.hasNoComponent;

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      // -------------------------------------------------------------------
      if (oldStartBlock === null) {
        oldStartBlock = oldCh[++oldStartIdx];
      }
      // -------------------------------------------------------------------
      else if (oldEndBlock === null) {
        oldEndBlock = oldCh[--oldEndIdx];
      }
      // -------------------------------------------------------------------
      else if (oldStartBlock.key === newStartBlock.key) {
        childPatch.call(oldStartBlock, newStartBlock);
        newCh[newStartIdx] = oldStartBlock;
        oldStartBlock = oldCh[++oldStartIdx];
        newStartBlock = newCh[++newStartIdx];
      }
      // -------------------------------------------------------------------
      else if (oldEndBlock.key === newEndBlock.key) {
        childPatch.call(oldEndBlock, newEndBlock);
        newCh[newEndIdx] = oldEndBlock;
        oldEndBlock = oldCh[--oldEndIdx];
        newEndBlock = newCh[--newEndIdx];
      }
      // -------------------------------------------------------------------
      else if (oldStartBlock.key === newEndBlock.key) {
        // bnode moved right
        childPatch.call(oldStartBlock, newEndBlock);
        const nextChild = newCh[newEndIdx + 1];
        oldStartBlock.moveBefore(nextChild, _anchor);
        newCh[newEndIdx] = oldStartBlock;
        oldStartBlock = oldCh[++oldStartIdx];
        newEndBlock = newCh[--newEndIdx];
      }
      // -------------------------------------------------------------------
      else if (oldEndBlock.key === newStartBlock.key) {
        // bnode moved left
        childPatch.call(oldEndBlock, newStartBlock);
        const nextChild = oldCh[oldStartIdx];
        oldEndBlock.moveBefore(nextChild, _anchor);
        newCh[newStartIdx] = oldEndBlock;
        oldEndBlock = oldCh[--oldEndIdx];
        newStartBlock = newCh[++newStartIdx];
      }
      // -------------------------------------------------------------------
      else {
        mapping = mapping || createMapping(oldCh, oldStartIdx, oldEndIdx);
        let idxInOld = mapping[newStartBlock.key];
        if (idxInOld === undefined) {
          childMount.call(newStartBlock, parent, oldStartBlock.firstNode() || null);
        } else {
          const elmToMove = oldCh[idxInOld];
          elmToMove.moveBefore(oldStartBlock, null);
          childPatch.call(elmToMove, newStartBlock);
          newCh[newStartIdx] = elmToMove;
          oldCh[idxInOld] = null as any;
        }
        newStartBlock = newCh[++newStartIdx];
      }
    }
    // ---------------------------------------------------------------------
    if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
      if (oldStartIdx > oldEndIdx) {
        const nextChild = newCh[newEndIdx + 1];
        const anchor = nextChild ? nextChild.firstNode() || null : _anchor;
        const mount = proto.mount;
        for (let i = newStartIdx; i <= newEndIdx; i++) {
          mount.call(newCh[i], parent, anchor);
        }
      } else {
        for (let i = oldStartIdx; i <= oldEndIdx; i++) {
          let ch = oldCh[i];
          if (ch) {
            childRemove.call(ch);
            // if (noFullRemove) {
            // remove(ch);
            // ch.remove();
            // } else {
            // ch.remove();
          }
        }
      }
    }
    this.children = newCh;
  }

  remove() {
    const { parentEl, anchor } = this;
    if (this.singleNode) {
      nodeSetTextContent.call(parentEl, "");
    } else {
      const children = this.children;
      const l = children.length;
      if (l) {
        for (let i = 0; i < l; i++) {
          children[i].remove();
        }
      }
      nodeRemoveChild.call(parentEl, anchor!);
    }
  }

  firstNode(): Node | undefined {
    const child = this.children[0];
    return child ? child.firstNode() : undefined;
  }
}

export function list(children: BNode[]): BNode<BNodeList> {
  return new BNodeList(children);
}

function createMapping(
  oldCh: any[],
  oldStartIdx: number,
  oldEndIdx: number
): { [key: string]: any } {
  let mapping: any = {};
  for (let i = oldStartIdx; i <= oldEndIdx; i++) {
    mapping[oldCh[i].key] = i;
  }
  return mapping;
}
