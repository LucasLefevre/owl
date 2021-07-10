import type { App } from "./app";
import type { Block } from "../bdom";
import { ChildFiber, MountFiber, RootFiber } from "./fibers";
import type { Component } from "./component";
import { STATUS } from "../status";

let currentNode: OwlNode | null = null;

export function getCurrent(): OwlNode | null {
  return currentNode;
}

type LifecycleHook = Function;

export class OwlNode {
  app: App;
  bdom: null | Block = null;
  component: Component;
  fiber: ChildFiber | RootFiber | null = null;
  status: STATUS = STATUS.NEW;
  renderFn: Function;
  children: { [key: string]: OwlNode } = {};

  willStart: LifecycleHook[] = [];

  constructor(app: App, C: typeof Component, props: any) {
    this.app = app;
    currentNode = this;
    const component = new C(props, app.env, this);
    component.setup();
    this.component = component;
    this.renderFn = app.getTemplate(C.template).bind(null, component);
  }

  async mount(target: any) {
    const fiber = new MountFiber(this, target);
    this.app.scheduler.addFiber(fiber);
    await Promise.all(this.willStart.map((f) => f()));
    this._render(fiber);
    return fiber.promise.then(() => this.component);
  }

  render() {
    const fiber = new RootFiber(this);
    this.app.scheduler.addFiber(fiber);
    this._render(fiber);
    return fiber.promise;
  }

  async initiateRender(fiber: ChildFiber) {
    await Promise.all(this.willStart.map((f) => f()));
    this._render(fiber);
  }

  async updateAndRender(props: any, fiber: ChildFiber) {
    await Promise.resolve(); // willupdateprops
    this.component.props = props;
    this._render(fiber);
    // const componentData = component.__owl__;
    // componentData.fiber = fiber;
    // await component.willUpdateProps(props);
    // component.props = props;
    // fiber.bdom = componentData.render();
    // fiber.root.counter--;
  }

  _render(fiber: ChildFiber | RootFiber) {
    this.fiber = fiber;
    fiber.bdom = this.renderFn();
    fiber.root.counter--;
  }

  destroy() {
    this.bdom!.remove();
    this.status = STATUS.DESTROYED;
  }
}