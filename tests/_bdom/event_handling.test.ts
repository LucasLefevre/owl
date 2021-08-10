import { mount, makeBlock as origMakeBlock } from "../../src/_bdom";
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

test("simple event handling ", async () => {
  const block = makeBlock('<div owl-handler-0="click"></div>');
  let n = 0;
  const obj = { f: () => n++ };
  const tree = block([[obj, "f"]]);

  mount(tree, fixture);
  expect(fixture.innerHTML).toBe("<div></div>");

  expect(fixture.firstChild).toBeInstanceOf(HTMLDivElement);
  expect(n).toBe(0);
  (fixture.firstChild as HTMLDivElement).click();
  expect(n).toBe(1);
});

test("simple event handling, with function", async () => {
  const block = makeBlock('<div owl-handler-0="click"></div>');
  let n = 0;
  const tree = block([() => n++]);

  mount(tree, fixture);
  expect(fixture.innerHTML).toBe("<div></div>");

  expect(fixture.firstChild).toBeInstanceOf(HTMLDivElement);
  expect(n).toBe(0);
  (fixture.firstChild as HTMLDivElement).click();
  expect(n).toBe(1);
});
