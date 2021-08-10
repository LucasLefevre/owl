import { mount, multi, patch, remove, text, makeBlock as origMakeBlock } from "../../src/_bdom";
import { _compileBlock } from "../../src/_bdom/element";
import { makeTestFixture } from "../helpers";

function makeBlock(str: string) {
  const { builder } = _compileBlock(str);
  expect(builder.toString()).toMatchSnapshot();
  return origMakeBlock(str);
}

//------------------------------------------------------------------------------
// Setup and helpers
//------------------------------------------------------------------------------

let fixture: HTMLElement;

beforeEach(() => {
  fixture = makeTestFixture();
});

afterEach(() => {
  fixture.remove();
});

describe("multi blocks", () => {
  test("multiblock with 2 text blocks", async () => {
    const tree = multi([text("foo"), text("bar")]);
    mount(tree, fixture);
    expect(fixture.innerHTML).toBe("foobar");
  });

  test("a multiblock can be removed and leaves no extra text nodes", async () => {
    const block1 = makeBlock("<div>foo</div>");
    const block2 = makeBlock("<span>bar</span>");

    const tree = multi([block1(), block2()]);

    expect(fixture.childNodes.length).toBe(0);
    mount(tree, fixture);
    expect(fixture.childNodes.length).toBe(4);
    remove(tree);
    expect(fixture.childNodes.length).toBe(0);
  });

  test("multiblock with an empty children", async () => {
    const block = makeBlock("<div>foo</div>");
    const tree = multi([block(), undefined]);

    mount(tree, fixture);
    expect(fixture.innerHTML).toBe("<div>foo</div>");
  });

  test("multi block in a regular block", async () => {
    const block1 = makeBlock("<div><owl-child-0/></div>");
    const block2 = makeBlock("<span>yip yip</span>");

    const tree = block1([], [multi([block2()])]);

    mount(tree, fixture);
    expect(fixture.innerHTML).toBe("<div><span>yip yip</span></div>");
  });

  test("patching a multiblock ", async () => {
    const tree = multi([text("foo"), text("bar")]);
    mount(tree, fixture);
    expect(fixture.innerHTML).toBe("foobar");

    patch(tree, multi([text("blip"), text("bar")]));
    expect(fixture.innerHTML).toBe("blipbar");
  });
});
