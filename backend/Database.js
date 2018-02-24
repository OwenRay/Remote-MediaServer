/*jshint loopfunc: true */
"use strict";

const fs = require("fs");
const uuid = require("node-uuid");
const Log = require("./helpers/Log.js");

class Database {

    constructor() {
        this.ids = {};
        this.tables = {};
        this.version = 0;
        this.writeTimeout = null;
    }

    checkTable(type)
    {
        if(!this.tables[type])
        {
            this.tables[type] = {};
        }
    }

    setObject(type, obj)
    {
        this.checkTable(type);
        if(!this.ids[type]) {
            this.ids[type] = 1;
        }

        const o = {id: obj.id};
        if(!o.id) {
            o.id = this.ids[type]++;
        }
        if(!obj.uuid)
        {
            obj.uuid = uuid.v4();
        }
        o.type = type;
        o.attributes = obj;
        this.tables[type][o.id] = o;
        this.save();
        return o;
    }

    deleteObject(type, id)
    {
        this.checkTable();
        if(this.tables[type][id]) {
            delete this.tables[type][id];
        }
        this.save();
    }

    update(type, obj)
    {
        this.checkTable(type);

        this.tables[type][obj.id] = obj;
        this.save();
        return obj;
    }

    fileExists(type, id)
    {
        return !!this.tables[type]&&!!this.tables[type][id];
    }

    findBy(type, key, value)
    {
        let table = this.tables[type];
        if(!table) {
            return [];
        }

        const items = [];
        for(let itemKey in table)
        {
            if(table[itemKey]&&table[itemKey].attributes[key]===value)
            {
                items.push(table[itemKey]);
            }
        }
        return items;
    }

    findByMatchFilters(type, filters)
    {
        let table = this.tables[type];
        if(!table) {
            return [];
        }
        const filterProps = {};

        // loop over the filters and apply search arguments
        // %test%       match test somwhere in the string
        // test%        starts with test
        // %test        ends with test
        // >1           greater then 1
        // <1           less then 1
        // 2><6         value between 2 and 6
        for(let key in filters)
        {
            type = "normal";
            const a = filters[key][0] === "%";
            const b = filters[key][filters[key].length - 1] === "%";
            if (a && b) {
                type = "search";
                filters[key] = filters[key].substring(1, filters[key].length - 1);
            } else if (a) {
                type = "endsWith";
                filters[key] = filters[key].substring(1);
            } else if (b) {
                type = "startsWith";
                filters[key] = filters[key].substring(0, filters[key].length - 1);
            }else if(filters[key][0]==="<") {
                type = "lt";
                filters[key] = filters[key].substring(1);
            }else if(filters[key][0]===">") {
                type = "gt";
                filters[key] = parseFloat(filters[key].substring(1));
            }else if(filters[key].match(/^[0-9.]+><?[0-9.]+$/)) {
                type = "ltgt";
                filters[key] = filters[key].split("><").map(flt=>parseFloat(flt));
            }else{
                filters[key] = (filters[key]+"").toLocaleLowerCase();
            }
            filterProps[key] = type;
        }

        let numFilters = 0;

        for (const item in filters) { // jshint ignore:line
            numFilters++;
        }

        const items = [];
        for(let itemKey in table)
        {
            const item = table[itemKey];
            if(!item.id) {
                continue;
            }
            let match = 0;
            for(let filterKey in filters)
            {
                //when we're looking for (for example) extra=false,
                //we also want items that don't have the extra attribute, thats why:
                if(item.attributes[filterKey]===undefined) {
                    item.attributes[filterKey] = false;
                }

                if (!this.matches(
                            item.attributes[filterKey],
                            filters[filterKey],
                            filterProps[filterKey]
                        )
                    )
                {
                    break;
                }
                match++;
            }
            if(match===numFilters) {
                items.push(item);
            }
        }
        return items;
    }

    matches(value, filter, filterProp)
    {
        if(["lt","gt","ltgt"].includes(filterProp)) {
            if(!value) {
                value = 0;
            }
            value=parseFloat(value);
        }else if(!Array.isArray(value)) {
            value = (value + "").toLowerCase();
        }

        switch(filterProp)
        {
            case "endsWith":
                return value.indexOf(filter)+filter.length===value.length;
            case "startsWith":
                return value.indexOf(filter)===0;
            case "search":
                return value.indexOf(filter)>=0;
            case "lt":
                return value<filter;
            case "gt":
                return value>filter;
            case "ltgt":
                return value>filter[0]&&value<filter[1];
            case "normal":
                if(Array.isArray(value)) {
                    return value.includes(filter)||
                           value.includes(parseInt(filter));
                }
                return value===filter;
        }
    }

    getById(type, id)
    {
        if(!this.tables[type]) {
            return null;
        }
        return this.tables[type][id];
    }

    getAll(type)
    {
        Log.debug("getall");
        this.checkTable(type);
        const table = this.tables[type];
        const items = [];
        for(let key in table) {
            items.push(table[key]);
        }
        return items;
    }

    load()
    {
        try {
            if (fs.existsSync('db')) {
                const items = JSON.parse(fs.readFileSync("db", "utf8"));
                for (let key in items) {
                    this[key] = items[key];
                }
            }
        }catch(e){
            Log.exception(e);
        }
    }

    save()
    {
        if(this.writeTimeout) {
            clearTimeout(this.writeTimeout);
        }
        this.writeTimeout = setTimeout(this.doSave.bind(this), 3000);
    }

    doSave(callback)
    {
        Log.debug("Did write db");
        if(this.writeTimeout) {
            clearTimeout(this.writeTimeout);
        }
        this.writeTimeout = null;
        fs.writeFile("db", JSON.stringify(this), callback?callback:()=>{});
    }
}


const db = new Database();
db.load();

module.exports = db;
