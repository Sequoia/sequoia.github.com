export const l = console.log.bind(console);
export const e = console.error.bind(console);
//for mapping over arrays arrays in arrays & transforming just one part
export const justIndex = idx => fn => ray => ray.map((x, i) => i === idx ? fn(x) : x);
