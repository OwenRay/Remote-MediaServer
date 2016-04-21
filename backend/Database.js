/**
 * Created by owenray on 08-04-16.
 */
"use strict";
var fs = require("fs");
var uuid = require("node-uuid");

class Database {

    constructor() {
        this.tables = {};
        this.ids = {};
        this.writeTimeout = null;
    }

    setObject(type, obj)
    {
        if(!this.tables[type])
        {
            this.tables[type] = [];
        }
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
    }
    
    update(type, obj)
    {
        if(!this.tables[type])
        {
            this.tables[type] = [];
        }
        
        this.tables[type][obj.id] = obj;
        this.save();
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

        var numFilters = 0;
        for(var filterKey in filters)
        {
            numFilters++;
        }

        var items = [];
        for(var itemKey in table)
        {
            var item = table[itemKey];
            var match = 0;
            for(var filterKey in filters)
            {
                if (item.attributes[filterKey] !== filters[filterKey]) {
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

    getById(type, id)
    {
        if(!this.tables[type])
            return null;
        return this.tables[type][id];
    }

    getAll(type)
    {
        return this.tables[type].slice();
    }

    load()
    {
        try{
            var items = JSON.parse(fs.readFileSync("db", "utf8"));
            for(var key in items)
            {
                this[key] = items[key];
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

    doSave()
    {
        console.log("Did write db");
        this.writeTimeout = null;
        fs.writeFile("db", JSON.stringify(this));
    }
}

var db = new Database();
db.load();

module.exports = db;