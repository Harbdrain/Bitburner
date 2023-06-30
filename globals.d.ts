import * as bitburner from "./NetScriptDefinitions";

export { };

declare global {
    interface NS extends bitburner.NS { }

    type AutocompleteConfig = [string, string | number | boolean | string[]][];

    interface AutocompleteData {
        servers: string[],
        txts: string[],
        scripts: string[],
        flags: (config: AutocompleteConfig) => any
    }
}
