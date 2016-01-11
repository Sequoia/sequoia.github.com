//TODO make this into separate module
//TODO make `l` use `debug`
export const l = console.log.bind(console);
export const e = console.error.bind(console);
//for mapping over arrays in arrays & transforming just one part
export const justIndex = idx => fn => ray => ray.map((x, i) => i === idx ? fn(x) : x);
//for mapping over objects in arrays & transforming just one part
export const onProp = key => fn => obj => { obj[key] = fn(obj[key]); return obj; };
//add k/v to obj & return obj
export const addProp = prop => val => obj => { obj[prop] = val; return obj; };
//add k/v to obj based on fn & return obj
export const addPropFn = prop => fn => obj => { obj[prop] = fn(obj); return obj; };
