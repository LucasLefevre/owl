import { Block } from "./bdom";
import { Component } from "./component";
import { makeChildFiber, __internal__destroyed } from "./fibers";
import { OwlNode } from "./owl_node";
import { STATUS } from "./status";

// -----------------------------------------------------------------------------
//  Component Block
// -----------------------------------------------------------------------------

export class BNode extends Block {
  node: OwlNode;
  parentClass?: any = null;
  classTarget?: HTMLElement;
  handlers: any = null;

  /**
   *
   * @param name
   * @param props
   * @param key
   * @param owner the component in which the component was defined
   * @param parent the actual parent (may be different in case of slots)
   */
  constructor(name: string | Component, props: any, key: string, owner: any, parent: OwlNode) {
    super();
    let node: OwlNode | undefined = parent.children[key];
    let isDynamic = typeof name !== "string";

    if (node && node.status < STATUS.MOUNTED) {
      node.destroy();
      // delete parent.children[key];
      node = undefined;
    }
    if (node && isDynamic && node.component.constructor !== name) {
      node = undefined;
    }

    const parentFiber = parent.fiber!;
    if (node) {
      // update
      const fiber = makeChildFiber(node, parentFiber);
      if (node.willPatch.length) {
        parentFiber.root.willPatch.push(fiber);
      }
      if (node.patched.length) {
        parentFiber.root.patched.push(fiber);
      }
      node.updateAndRender(props, fiber);
    } else {
      // new component
      const C = isDynamic ? name : owner.constructor.components[name as any];
      node = new OwlNode(parent.app, C, props);
      parent.children[key] = node;
      const fiber = makeChildFiber(node, parentFiber);
      if (node.mounted.length) {
        parentFiber.root.mounted.push(fiber);
      }
      node.initiateRender(fiber);
    }
    this.node = node;
  }

  firstChildNode(): ChildNode | null {
    const bdom = this.node.bdom;
    return bdom ? bdom.firstChildNode() : null;
  }

  mountBefore(anchor: ChildNode) {
    const node = this.node;
    const bdom = node.fiber!.bdom!;
    node.bdom = bdom;
    bdom.mountBefore(anchor);
    if (this.parentClass) {
      this.parentClass = this.parentClass.trim().split(/\s+/);
      const el = this.firstChildNode();
      if (el instanceof HTMLElement) {
        this.addClass(el);
      }
    }
    node.status = STATUS.MOUNTED;
    node.fiber!.appliedToDom = true;
    node.fiber = null;
    if (this.handlers) {
      for (let i = 0; i < this.handlers.length; i++) {
        const handler = this.handlers[i];
        const eventType = handler[0];
        const el = this.node.component.el!;
        el.addEventListener(eventType, (ev: Event) => {
          const info = this.handlers![i];
          const [, callback] = info;
          callback(ev);
        });
      }
    }
  }

  moveBefore(anchor: ChildNode) {
    this.node.bdom!.moveBefore(anchor);
  }

  addClass(el: HTMLElement) {
    this.classTarget = el;
    for (let cl of this.parentClass) {
      el.classList.add(cl);
    }
  }

  removeClass(el: HTMLElement) {
    for (let cl of this.parentClass) {
      el.classList.remove(cl);
    }
  }

  patch() {
    const node = this.node;

    node.bdom!.patch(node!.fiber!.bdom!);
    if (this.parentClass) {
      const el = this.firstChildNode();
      if (el !== this.classTarget) {
        if (el && this.classTarget) {
          this.removeClass(this.classTarget);
          this.addClass(el as any);
        } else if (el) {
          this.addClass(el as any);
        } else {
          this.removeClass(this.classTarget!);
          this.classTarget = undefined;
        }
      }
    }
    node.fiber!.appliedToDom = true;
    node.fiber = null;
  }

  beforeRemove() {
    visitRemovedNodes(this.node);
  }

  remove() {
    const bdom = this.node.bdom!;
    bdom.remove();
  }
}

function visitRemovedNodes(node: OwlNode) {
  if (node.status === STATUS.MOUNTED) {
    const component = node.component;
    for (let cb of node.willUnmount) {
      cb.call(component);
    }
  }
  for (let child of Object.values(node.children)) {
    visitRemovedNodes(child);
  }
  node.status = STATUS.DESTROYED;
  if (node.destroyed.length) {
    __internal__destroyed.push(node);
  }
}