"use strict";

var fs = require("fs");

class Database {

    constructor() {
        this.tables = {};
        this.ids = {};
        this.writeTimeout = null;
    }

    setObject(type, obj)
    {
        console.log("SET!!");
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
        o.type = type;
        o.attributes = obj;
        this.tables[type][o.id] = o;
        console.log("add:", type, o.id, o);
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

    getById(type, id)
    {
        if(!this.tables[type])
            return null;
        return this.tables[type][id];
    }

    getAll(type)
    {
        if(!this.tables[type]) {
            this.tables[type] = [];
        }

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
