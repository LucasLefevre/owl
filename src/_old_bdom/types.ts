export interface Block<T = any> {
  mountBefore(anchor: Anchor): void;
  patch(block: T): void;
  moveBefore(anchor: Anchor): void;
  remove(): void;
  firstChildNode(): ChildNode | null;
  el?: any;
  key?: any;
}

// interface Shape1 {
//     ops: Operations;
//     value: any;
//     data: string;
// }

// text => shape1
// text.ops = ...;
// text.value = Text | undefined;
// text.data = string

// elem => shape2
// ops: ...
// value: el
// data: data, children, ...

// multi => shape2
// ops: ...
// value: children[]
// data: anchor[]

// list =>
// ops: ...
// value: children[]
// data: {anchor, isonlychild, hasnocomponent}

// Text
// export interface BlockText {
//   ops: Operations;
//   el: Text | undefined;
//   key?: any | undefined;
//   data: string;
//   content: undefined;
// }

// Elem

// export type Builder = any;

// export interface ElemData {
//   builder: Builder;
//   data: any[];
//   //   handlers?: [object, string][]
//   //   refs: (HTMLElement | Text)[]
// }

// export interface BlockElement {
//   ops: Operations;
//   el: HTMLElement | undefined;
//   key?: any | undefined;
//   data: ElemData;
//   content: undefined | Block[];
// }

// // Multi
// export interface BlockMulti {
//   ops: Operations;
//   el: undefined;
//   key?: any | undefined;
//   data: Anchor[] | undefined;
//   content: (Block | undefined)[];
// }

// // List
// export interface BlockList {
//   ops: Operations;
//   el: undefined;
//   key?: any | undefined;
//   data: { anchor: Anchor | undefined; isOnlyChild: boolean; hasNoComponent: boolean };
//   content: Block[];
// }

// export type Block = BlockText | BlockElement | BlockMulti | BlockList;

export type Anchor = Text;
