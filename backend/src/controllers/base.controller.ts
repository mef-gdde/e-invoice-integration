export class BaseController {
    constructor() {
        const prototype = Object.getPrototypeOf(this);

        // Automatically bind all methods
        Object.getOwnPropertyNames(prototype)
            .filter(name => name !== 'constructor' && typeof prototype[name] === 'function')
            .forEach(name => {
                (this as any)[name] = (this as any)[name].bind(this);
            });
    }
}
