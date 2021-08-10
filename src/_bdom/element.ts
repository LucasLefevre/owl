import { Block } from "./types";

export interface BlockElem extends Block<BlockElem> {
  data: any[];
  children: Block[];
  refs?: (HTMLElement | Text)[];
}

type BlockBuilder = (data?: any[], children?: any[]) => BlockElem;

// const mountBefore = (build: BlockElem["build"]): BlockElem["mountBefore"] =>  {
//   return function mountBefore(this: BlockElem, anchor: any) {
//     this.build();
//     anchor.before(this.el);
//   }
// };

// function  patch(block1: any, block2: any) {
//     if (block1 === block2) {
//       return;
//     }
//     (block1 as any).data.builder.update((block2 as any).data, block2.content);
//   },
function moveBefore(this: BlockElem, anchor: any) {
  anchor.before(this.el!);
}

function remove(this: BlockElem) {
  const el = this.el!;
  el.parentElement!.removeChild(el);
}

function firstChildNode(this: BlockElem): ChildNode | null {
  return this.el;
}

// -----------------------------------------------------------------------------
//  makeBuilder
// -----------------------------------------------------------------------------
interface BuilderContext {
  path: string[];
  isDynamic: boolean;
  hasChild: boolean;
  hasHandler: boolean;
  info: {
    index: number;
    type: "text" | "child" | "handler" | "attribute";
    path: string;
    event?: string;
    name?: string;
  }[];
}

function toDom(node: ChildNode, ctx: BuilderContext): HTMLElement | Text | Comment {
  switch (node.nodeType) {
    case 1: {
      // HTMLElement
      const tagName = (node as Element).tagName;
      if (tagName.startsWith("owl-text-")) {
        const index = parseInt(tagName.slice(9), 10);
        ctx.info.push({ index, path: ctx.path.join("."), type: "text" });
        ctx.isDynamic = true;
        return document.createTextNode("");
      }
      if (tagName.startsWith("owl-child-")) {
        const index = parseInt(tagName.slice(10), 10);
        ctx.info.push({ index, type: "child", path: ctx.path.join(".") });
        ctx.hasChild = true;
        return document.createTextNode("");
      }
      const result = document.createElement((node as Element).tagName);
      const attrs = (node as Element).attributes;
      for (let i = 0; i < attrs.length; i++) {
        const attrName = attrs[i].name;
        const attrValue = attrs[i].value;
        if (attrName.startsWith("owl-handler-")) {
          const index = parseInt(attrName.slice(12), 10);
          ctx.info.push({ index, path: ctx.path.join("."), type: "handler", event: attrValue });
          ctx.hasHandler = true;
        } else if (attrName.startsWith("owl-attribute-")) {
          const index = parseInt(attrName.slice(14), 10);
          ctx.info.push({ index, path: ctx.path.join("."), type: "attribute", name: attrValue });
          ctx.isDynamic = true;
        } else {
          result.setAttribute(attrs[i].name, attrValue);
        }
      }
      let children = (node as Element).childNodes;
      const initialPath = ctx.path.slice();
      let currentPath = initialPath.slice();
      for (let i = 0; i < children.length; i++) {
        currentPath = currentPath.concat(i === 0 ? "firstChild" : "nextSibling");
        ctx.path = currentPath;
        result.appendChild(toDom(children[i], ctx));
      }
      ctx.path = initialPath;
      return result;
    }
    case 3: {
      // text node
      return document.createTextNode(node.textContent!);
    }
    case 8: {
      // comment node
      return document.createComment(node.textContent!);
    }
  }
  throw new Error("boom");
}

interface CompiledOutput {
  template: HTMLElement;
  builder: (
    template: HTMLElement,
    updateClass: any,
    handler: any
  ) => { mountBefore: BlockElem["mountBefore"]; patch: BlockElem["patch"] };
  hasChild: boolean;
}

export function _compileBlock(str: string): CompiledOutput {
  const info: BuilderContext["info"] = [];
  const ctx: BuilderContext = {
    path: ["el"],
    info,
    hasChild: false,
    hasHandler: false,
    isDynamic: false,
  };

  const doc = new DOMParser().parseFromString(str, "text/xml");
  const template = toDom(doc.firstChild!, ctx) as any;
  const isDynamic = ctx.isDynamic;
  const hasChild = ctx.hasChild;
  const hasHandler = ctx.hasHandler;

  // console.log(context)
  // const signature = hasChild ? "data, children" : isDynamic || hasHandler ? "data" : "";
  const code: string[] = [
    `  return {`,
    `    mountBefore(anchor) {`,
    `      this.el = template.cloneNode(true);`,
  ];

  // preparing all internal refs
  if (info.length) {
    for (let i = 0; i < info.length; i++) {
      code.push(`      let ref${i} = this.${info[i].path};`);
    }

    if (isDynamic) {
      code.push(`      const data = this.data;`);
    }
    if (hasChild) {
      code.push(`      const children = this.children;`);
    }
    if (hasHandler) {
    }
    //   code.push(`      const handler = this.handleEvent;`);

    for (let i = 0; i < info.length; i++) {
      const data = info[i];
      const index = info[i].index;
      switch (info[i].type) {
        case "text":
          code.push(`      ref${i}.textContent = data[${info[i].index}];`);
          break;
        case "attribute":
          if (data.name === "class") {
            code.push(`      updateClass(ref${i}, null, data[${index}]);`);
          } else {
            code.push(
              `      let value${index} = data[${index}]; ref${i}.setAttribute("${data.name}", value${index} === true ? "" : value${index});`
            );
          }
          break;
        case "handler":
          code.push(
            `      ref${i}.addEventListener("${info[i].event}", handler.bind(this, ${info[i].index}));`
          );
          break;

        case "child":
          code.push(
            `      let child${index} = children[${index}]; if (child${index}) { child${index}.mountBefore(ref${i}); }`
          );
      }
    }
    code.push(
      `      this.refs = [${info.map((t: any, index: number) => `ref${index}`).join(", ")}];`
    );
  }

  // if (isDynamic || hasHandler) {
  //   code.push(`      this.data = [];`);
  // }
  // if (hasChild) {
  //   code.push(`      this.children = [];`);
  // }
  // if (hasHandler) {
  //   // todo
  //   code.push(`      const handler = this.handleEvent;`);
  //   for (let i = 0; i < info.length; i++) {
  //     if (info[i].type === "handler") {
  //       code.push(
  //         `      ref${i}.addEventListener("${info[i].event}", handler.bind(this, ${info[i].index}));`
  //       );
  //     }
  //   }
  // }

  // end of constructor
  code.push(`      anchor.before(this.el);`);
  // code.push(`    }`);
  code.push(`    },`);
  code.push(`    patch(block) {`);
  if (info.length) {
    code.push(`      if (this === block) return;`);
    if (isDynamic || hasChild) {
      code.push(`      const refs = this.refs;`);
    }
    if (isDynamic || hasHandler) {
      code.push(`      const current = this.data;`);
      code.push(`      const next = block.data;`);
    }
  }
  // update function
  if (info.length) {
    //   if (isDynamic || hasHandler) {
    //   }
    if (hasChild) {
      code.push(`      const children = this.children;`);
      code.push(`      const nextChildren = block.children;`);
    }

    for (let i = 0; i < info.length; i++) {
      const data = info[i];
      const index = data.index;
      switch (data.type) {
        case "text":
          code.push(
            `      if (next[${index}] !== current[${index}]) { refs[${i}].textContent = next[${index}]}`
          );
          break;
        case "attribute":
          if (data.name === "class") {
            code.push(
              `      if (next[${index}] !== current[${index}]) { updateClass(refs[${i}], current[${index}], next[${index}]); }`
            );
          } else {
            code.push(
              `      if (next[${index}] !== current[${index}]) { let value = next[${index}]; refs[${i}].setAttribute("${data.name}", value === true ? "" : value);}`
            );
          }
          break;
        case "child":
          code.push(
            `      let child${index} = children[${index}], nextChild${index} = nextChildren[${index}];`
          );
          code.push(
            `      if (child${index}) { if (nextChild${index}) { child${index}.patch(nextChild${index}); } else { child${index}.remove(); children[${index}] = null; } }`
          );
          code.push(
            `      else if (nextChild${index}) { nextChild${index}.mountBefore(refs[${i}]); children[${index}] = nextChild${index}; }`
          );
      }
    }
  }
  if (isDynamic || hasHandler) {
    code.push(`      this.data = next;`);
  }
  // }
  // code.push(`    }`);
  // if (hasHandler) {
  //   // todo: move handleEvent outside of compiled code (like updateClass)
  //   code.push(`    handleEvent(n) {`);
  //   code.push(`      const handler = this.data[n];`);
  //   code.push(`      if (typeof handler === "function") {`);
  //   code.push(`        handler();`);
  //   code.push(`      } else {`);
  //   code.push(`        const [owner, method] = handler;`);
  //   code.push(`        owner[method]();`);
  //   code.push(`      }`);
  //   code.push(`    }`);
  // }
  code.push(`    }`);
  code.push(`  };`);

  // console.warn(code.join("\n"));
  const wrapper: any = new Function("template, updateClass, handler", code.join("\n"));
  return { template, builder: wrapper, hasChild };
}

export function makeBlock(str: string): BlockBuilder {
  const { template, builder, hasChild } = _compileBlock(str);
  const { mountBefore, patch } = builder(template, updateClass, handler);
  if (hasChild) {
    return (data: any[] = [], children: Block[] = []) => ({
      mountBefore,
      patch,
      moveBefore,
      remove,
      firstChildNode,
      data,
      children,
      el: undefined,
      key: undefined,
    });
  } else {
    return (data: any[] = []) => ({
      mountBefore,
      patch,
      moveBefore,
      remove,
      firstChildNode,
      data,
      children: [],
      el: undefined,
      key: undefined
    });
  }
}

// -----------------------------------------------------------------------------
// helpers
// -----------------------------------------------------------------------------

function updateClass(elem: HTMLElement, prev: any, next: any) {
  prev = prev === undefined ? {} : toClassObj(prev);
  next = next === undefined ? {} : toClassObj(next);
  // remove classes
  for (let c in prev) {
    if (!(c in next)) {
      elem.classList.remove(c);
    }
  }
  // add classes
  for (let c in next) {
    if (!(c in prev)) {
      elem.classList.add(c);
    }
  }
}

function toClassObj(expr: string | number | { [c: string]: any }) {
  const result: { [c: string]: any } = {};

  if (typeof expr === "object") {
    // this is already an object but we may need to split keys:
    // {'a': true, 'b c': true} should become {a: true, b: true, c: true}
    for (let key in expr) {
      const value = expr[key];
      if (value) {
        const words = key.split(/\s+/);
        for (let word of words) {
          result[word] = value;
        }
      }
    }
    return result;
  }
  if (typeof expr !== "string") {
    expr = String(expr);
  }
  // we transform here a list of classes into an object:
  //  'hey you' becomes {hey: true, you: true}
  const str = expr.trim();
  if (!str) {
    return {};
  }
  let words = str.split(/\s+/);
  for (let i = 0, l = words.length; i < l; i++) {
    result[words[i]] = true;
  }
  return result;
}

function handler(this: BlockElem, n: number) {
  const handler = this.data[n];
  if (typeof handler === "function") {
    handler();
  } else {
    const [owner, method] = handler;
    owner[method]();
  }
}
