import type { BNode } from "./index";

const nodeProto = Node.prototype;

const nodeInsertBefore = nodeProto.insertBefore;
const nodeRemoveChild = nodeProto.removeChild;

class BHtml {
  html: string;
  parentEl?: HTMLElement | undefined;
  content: ChildNode[] = [];

  constructor(html: string) {
    this.html = html;
  }

  mount(parent: HTMLElement, afterNode: Node | null) {
    this.parentEl = parent;
    const div = document.createElement("div");
    div.innerHTML = this.html;
    this.content = [...div.childNodes];
    for (let elem of this.content) {
      nodeInsertBefore.call(parent, elem, afterNode);
    }
    if (!this.content.length) {
      const textNode = document.createTextNode('');
      this.content.push(textNode);
      nodeInsertBefore.call(parent, textNode, afterNode);
    }
  }

  moveBefore(other: BHtml | null, afterNode: Node | null) {
    const target = other ? other.content[0] : afterNode;
    const parent = this.parentEl;
    for (let elem of this.content) {
      nodeInsertBefore.call(parent, elem, target);
    }
  }

  patch(other: BHtml) {
    const html2 = other.html;
    if (this.html !== html2) {
      const parent = this.parentEl;
      // insert new html in front of current
      const afterNode = this.content[0];
      const div = document.createElement("div");
      div.innerHTML = html2;
      const content = [...div.childNodes];
      for (let elem of content) {
        nodeInsertBefore.call(parent, elem, afterNode);
      }
      if (!content.length) {
        const textNode = document.createTextNode('');
        content.push(textNode);
        nodeInsertBefore.call(parent, textNode, afterNode);
      }

      // remove current content
      this.remove();
      this.content = content;
    }
  }

  remove() {
    const parent = this.parentEl;
    for (let elem of this.content) {
      nodeRemoveChild.call(parent, elem);
    }
  }

  firstNode(): Node {
    return this.content[0]!;
  }
}

export function html(str: string): BNode<BHtml> {
  return new BHtml(str);
}
