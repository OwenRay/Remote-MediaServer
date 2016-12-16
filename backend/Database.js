"use strict";

var fs = require("fs");
var uuid = require("node-uuid");

class Database {

    constructor() {
        this.tables = {};
        this.ids = {};
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
            this.ids[type] = 0;
        }

        var o = {id:obj.id};
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
        var table = this.tables[type];
        if(!table) {
            return [];
        }

        var items = [];
        for(var itemKey in table)
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
        var table = this.tables[type];
        if(!table) {
            return [];
        }
        var filterProps = {};

        // loop over the filters and apply search arguments
        // %test%       match test somwhere in the string
        // test%        starts with test
        // %test        ends with test
        for(var key in filters)
        {
            var type = "normal";
            if(filters[key]==="false") {
                filters[key] = false;
            }else if(filters[key]=="true"){
                filters[key] = true;
            }else {
                var a = filters[key][0] == "%";
                var b = filters[key][filters[key].length - 1] == "%";
                if (a && b) {
                    type = "search";
                    filters[key] = filters[key].substring(1, filters[key].length - 1);
                } else if (a) {
                    type = "endsWith";
                    filters[key] = filters[key].substring(1);
                } else if (b) {
                    type = "startsWith";
                    filters[key] = filters[key].substring(0, filters[key].length - 1);
                }
                filters[key] = filters[key].toLowerCase();
            }
            filterProps[key] = type;
        }

        var numFilters = 0;
        for(var filterKey in filters)
        {
            numFilters++;
        }

        var items = [];
        for(var itemKey in table)
        {
            var item = table[itemKey];
            if(!item.id)
                continue;
            var match = 0;
            for(var filterKey in filters)
            {
                //when we're looking for (for example) extra=false,
                //we also want items that don't have the extra attribute, thats why:
                if(item.attributes[filterKey]===undefined)
                    item.attributes[filterKey] = false;

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
        if(typeof(filter) !== "boolean") {
            value = (value + "").toLowerCase()
            filter = (filter + "").toLowerCase()
        }else{
            console.log("bool");
        }
        switch(filterProp)
        {
            case "endsWith":
                return value.indexOf(filter)+filter.length===value.length;
            case "startsWith":
                return value.indexOf(filter)===0;
            case "search":
                //console.log(arguments, value.indexOf(filter)>=0);
                return value.indexOf(filter)>=0;
            case "normal":
                return value===filter;
        }
    }

    getById(type, id)
    {
        if(!this.tables[type])
            return null;
        return this.tables[type][id];
    }

    getAll(type)
    {
        console.log("getall");
        this.checkTable(type);
        var table = this.tables[type];
        var items = [];
        for(var key in table) {
            items.push(table[key]);
        }
        return items;
    }

    load()
    {
        try {
            if (fs.existsSync('db')) {
                var items = JSON.parse(fs.readFileSync("db", "utf8"));
                for (var key in items) {
                    this[key] = items[key];
                }
            }
        }catch(e){
            console.log(e);
        }
    }

    save()
    {
        if(this.writeTimeout)
            clearTimeout(this.writeTimeout);
        this.writeTimeout = setTimeout(this.doSave.bind(this), 3000);
    }

    doSave(callback)
    {
        console.log("Did write db");
        if(this.writeTimeout)
            clearTimeout(this.writeTimeout);
        this.writeTimeout = null;
        fs.writeFile("db", JSON.stringify(this), callback);
    }
}

var db = new Database();
db.load();

module.exports = db;
