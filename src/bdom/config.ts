export const config = {
  shouldNormalizeDom: true,
  mainEventHandler: (data: any, ev: Event) => data(ev),
};
