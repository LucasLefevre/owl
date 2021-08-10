import { Anchor, Block } from "./types";

export interface BlockText extends Block<BlockText> {
  el: Text | null;
  text: string;
}

export function text(text: string): BlockText {
  return {
    mountBefore,
    patch,
    moveBefore,
    remove,
    firstChildNode,
    el: null,
    text,
  };
}

function mountBefore(this: BlockText, anchor: Anchor) {
  let el = document.createTextNode(this.text);
  this.el = el;
  anchor.before(el);
}

function patch(this: BlockText, block: BlockText) {
  if (this === block) {
    return;
  }
  let text = block.text as any;
  if (this.text !== text) {
    this.text = text;
    this.el!.textContent = text;
  }
}

function moveBefore(this: BlockText, anchor: any) {
  anchor.before(this.el);
}

function remove(this: BlockText) {
  const el = this.el!;
  el.parentElement!.removeChild(el);
}

function firstChildNode(this: BlockText): ChildNode | null {
  return this.el;
}
