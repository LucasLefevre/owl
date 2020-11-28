import { renderToString, snapshotTemplateCode, TestTemplateSet } from "../helpers";

// -----------------------------------------------------------------------------
// t-foreach
// -----------------------------------------------------------------------------

describe("t-foreach", () => {
  test("simple iteration", () => {
    const template = `<t t-foreach="[3, 2, 1]" t-as="item" t-key="item"><t t-esc="item"/></t>`;
    snapshotTemplateCode(template);
    expect(renderToString(template)).toBe("321");
  });

  test("t-key on an inside node", () => {
    const template = `<t t-foreach="[3, 2, 1]" t-as="item"><p t-key="item"><t t-esc="item"/></p></t>`;
    snapshotTemplateCode(template);
    expect(renderToString(template)).toBe("<p>3</p><p>2</p><p>1</p>");
  });

  test("simple iteration with two nodes inside", () => {
    const template = `
      <t t-foreach="[3, 2, 1]" t-as="item" t-key="item">
        <span>a<t t-esc="item"/></span>
        <span>b<t t-esc="item"/></span>
      </t>`;
    snapshotTemplateCode(template);
    const expected =
      "<span>a3</span><span>b3</span><span>a2</span><span>b2</span><span>a1</span><span>b1</span>";
    expect(renderToString(template)).toBe(expected);
  });

  test("simple iteration (in a node)", () => {
    const template = `
        <div>
          <t t-foreach="[3, 2, 1]" t-as="item" t-key="item"><t t-esc="item"/></t>
        </div>`;
    snapshotTemplateCode(template);
    expect(renderToString(template)).toBe("<div>321</div>");
  });

  test("iterate on items", () => {
    const template = `
        <div>
          <t t-foreach="[3, 2, 1]" t-as="item" t-key="item">
            [<t t-esc="item_index"/>: <t t-esc="item"/> <t t-esc="item_value"/>]
          </t>
        </div>`;
    snapshotTemplateCode(template);
    expect(renderToString(template)).toBe("<div> [0: 3 3]  [1: 2 2]  [2: 1 1] </div>");
  });

  test("iterate on items (on a element node)", () => {
    const template = `
        <div>
          <span t-foreach="[1, 2]" t-as="item" t-key="item"><t t-esc="item"/></span>
        </div>`;
    snapshotTemplateCode(template);
    const expected = `<div><span>1</span><span>2</span></div>`;
    expect(renderToString(template)).toBe(expected);
  });

  test("iterate, position", () => {
    const template = `
        <div>
          <t t-foreach="Array(5)" t-as="elem" t-key="elem">
            -<t t-if="elem_first"> first</t><t t-if="elem_last"> last</t> (<t t-esc="elem_index"/>)
          </t>
        </div>`;
    snapshotTemplateCode(template);
    const expected = `<div> - first (0)  - (1)  - (2)  - (3)  - last (4) </div>`;
    expect(renderToString(template)).toBe(expected);
  });

  test("iterate, dict param", () => {
    const template = `
        <div>
          <t t-foreach="value" t-as="item" t-key="item_index">
            [<t t-esc="item_index"/>: <t t-esc="item"/> <t t-esc="item_value"/>]
          </t>
        </div>`;
    snapshotTemplateCode(template);
    const expected = `<div> [0: a 1]  [1: b 2]  [2: c 3] </div>`;
    const context = { value: { a: 1, b: 2, c: 3 } };
    expect(renderToString(template, context)).toBe(expected);
  });

  test("does not pollute the rendering context", () => {
    const template = `
        <div>
          <t t-foreach="[1]" t-as="item" t-key="item"><t t-esc="item"/></t>
        </div>`;
    snapshotTemplateCode(template);
    const context = { __owl__: {} };
    renderToString(template, context);
    expect(Object.keys(context)).toEqual(["__owl__"]);
  });

  test("t-foreach in t-foreach", () => {
    const template = `
        <div>
          <t t-foreach="numbers" t-as="number" t-key="number">
            <t t-foreach="letters" t-as="letter" t-key="letter">
              [<t t-esc="number"/><t t-esc="letter"/>]
            </t>
          </t>
        </div>`;

    snapshotTemplateCode(template);

    const context = { numbers: [1, 2, 3], letters: ["a", "b"] };
    const expected = "<div> [1a]  [1b]  [2a]  [2b]  [3a]  [3b] </div>";
    expect(renderToString(template, context)).toBe(expected);
  });

  test("t-call without body in t-foreach in t-foreach", () => {
    const templateSet = new TestTemplateSet();
    const sub = `
        <t>
          <t t-set="c" t-value="'x' + '_' + a + '_'+ b" />
          [<t t-esc="a" />]
          [<t t-esc="b" />]
          [<t t-esc="c" />]
        </t>`;

    const main = `
        <div>
          <t t-foreach="numbers" t-as="a" t-key="a">
            <t t-foreach="letters" t-as="b" t-key="b">
              <t t-call="sub" />
            </t>
            <span t-esc="c"/>
          </t>
          <span>[<t t-esc="a" />][<t t-esc="b" />][<t t-esc="c" />]</span>
        </div>`;

    templateSet.add("sub", sub);
    templateSet.add("main", main);
    snapshotTemplateCode(sub);
    snapshotTemplateCode(main);

    const context = { numbers: [1, 2, 3], letters: ["a", "b"] };
    const expected =
      "<div> [1] [a] [x_1_a]  [1] [b] [x_1_b] <span></span> [2] [a] [x_2_a]  [2] [b] [x_2_b] <span></span> [3] [a] [x_3_a]  [3] [b] [x_3_b] <span></span><span>[][][]</span></div>";
    expect(templateSet.renderToString("main", context)).toBe(expected);
  });

  test("t-call with body in t-foreach in t-foreach", () => {
    const templateSet = new TestTemplateSet();
    const sub = `
        <t>
          [<t t-esc="a" />]
          [<t t-esc="b" />]
          [<t t-esc="c" />]
        </t>`;

    const main = `
        <div>
          <t t-foreach="numbers" t-as="a" t-key="a">
            <t t-foreach="letters" t-as="b"  t-key="b">
              <t t-call="sub" >
                <t t-set="c" t-value="'x' + '_' + a + '_'+ b" />
              </t>
            </t>
            <span t-esc="c"/>
          </t>
          <span>[<t t-esc="a" />][<t t-esc="b" />][<t t-esc="c" />]</span>
        </div>`;

    templateSet.add("sub", sub);
    templateSet.add("main", main);
    snapshotTemplateCode(sub);
    snapshotTemplateCode(main);

    const context = { numbers: [1, 2, 3], letters: ["a", "b"] };
    const expected =
      "<div> [1] [a] [x_1_a]  [1] [b] [x_1_b] <span></span> [2] [a] [x_2_a]  [2] [b] [x_2_b] <span></span> [3] [a] [x_3_a]  [3] [b] [x_3_b] <span></span><span>[][][]</span></div>";
    expect(templateSet.renderToString("main", context)).toBe(expected);
  });

  test("throws error if invalid loop expression", () => {
    const test = `<div><t t-foreach="abc" t-as="item" t-key="item"><span t-key="item_index"/></t></div>`;
    expect(() => renderToString(test)).toThrow("Invalid loop expression");
  });

  test("warn if no key in some case", () => {
    const consoleWarn = console.warn;
    console.warn = jest.fn();

    const template = `
        <div>
          <t t-foreach="[1, 2]" t-as="item">
            <span><t t-esc="item"/></span>
          </t>
        </div>`;
    renderToString(template);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      `\"Directive t-foreach should always be used with a t-key! (in template: '
        <div>
          <t t-foreach=\"[1, 2]\" t-as=\"item\">
            <span><t t-esc=\"item\"/></span>
          </t>
        </div>')\"`
    );
    console.warn = consoleWarn;
  });
});
