import { mount, patch } from "../../src/_bdom";
import { makeBlock as origMakeBlock, _compileBlock } from "../../src/_bdom/element";
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

test("simple attribute", async () => {
  const block = makeBlock('<div owl-attribute-0="hello"></div>');
  const tree = block(["world"]);

  mount(tree, fixture);
  expect(fixture.innerHTML).toBe(`<div hello="world"></div>`);

  patch(tree, block(["owl"]));
  expect(fixture.innerHTML).toBe(`<div hello="owl"></div>`);
});

test("class attribute", async () => {
  const block = makeBlock('<div owl-attribute-0="class"></div>');
  const tree = block(["fire"]);

  mount(tree, fixture);
  expect(fixture.innerHTML).toBe(`<div class="fire"></div>`);

  patch(tree, block(["water"]));
  expect(fixture.innerHTML).toBe(`<div class="water"></div>`);

  patch(tree, block([""]));
  expect(fixture.innerHTML).toBe(`<div class=""></div>`);
});
