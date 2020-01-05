export function pickKeys<T>(obj: any, keys: string[]): T {
    const copy: any = {};

    keys.forEach(key => copy[key] = obj[key]);

    return copy;
}

// 0 to 6; Sunday to Saturday
export function getNextDay(d: string | number | Date, nextDay: number) {
    d = new Date(d);
    const day = d.getDay(),
        diffDay = (nextDay - day) <= 0 ? (nextDay - day) + 7 : (nextDay - day),
        diffDate = d.getDate() + diffDay; // - day = Last sunday; adjust when day is sunday
    return new Date(d.setDate(diffDate));
}

// 0 to 6; Sunday to Saturday
export function getPrevDay(d: string | number | Date, prevDay: number) {
    d = new Date(d);
    const day = d.getDay(),
        diffDay = (day == 0 ? -(7 - prevDay) : (prevDay == day) ? 7 : prevDay),
        diffDate = d.getDate() - day + diffDay; // - day = Last sunday; adjust when day is sunday
    return new Date(d.setDate(diffDate));
}

export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const copy = {} as Pick<T, K>;

    keys.forEach(key => copy[key] = obj[key]);

    return copy;
}

export function groupBy<K, Item>(items: Item[], keyGetter: (item: Item) => K): Map<K, Item[]> {
    // `data` is an array of objects, `key` is the key (or property accessor) to group by

    // reduce runs this anonymous function on each element of `items` (the `item` parameter,
    // returning the `storage` parameter at the end
    return items.reduce((map: Map<K, Item[]>, item: Item) => {
        // get the first instance of the key by which we're grouping
        const key = keyGetter(item);
        const group = map.get(key);

        if (!group) {
            // set `storage` for this instance of group to the outer scope (if not empty) or initialize it
            map.set(key, [item]);
        } else {
            // add this item to its group within `storage`
            group.push(item);
        }

        // return the updated storage to the reduce function, which will then loop through the next 
        return map;
    }, new Map<K, Item[]>()); // {} is the initial value of the storage
};

export function stringToEnumValue<ET, T>(enumObj: ET, str: string): T {
    return (enumObj as any)[Object.keys(enumObj).filter(k => (enumObj as any)[k] === str)[0]];
}

export function intersection<Item>(itemLists: Item[][]): Item[] {
    return itemLists.reduce((a, b) => a.filter(c => b.includes(c)));
}

export function assignOptionalProperties(target: any, source: any, optionalSourceKeys: string[], targetKeyForSourceKey: { [key: string]: string }): any {
    const optionalSearchConditions: any = {};

    for (const key of optionalSourceKeys) {
        const value = source[key];

        if (!value) {
            continue;
        }

        const targetKey = targetKeyForSourceKey[key];

        if (targetKey) {
            optionalSearchConditions[targetKey] = value;
        } else {
            optionalSearchConditions[key] = value;
        }
    }

    return Object.assign(target, optionalSearchConditions);
}