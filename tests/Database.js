var fs = require("fs");
var Database = require("../backend/Database");

module.exports = {
    testInsert(test)
    {
        test.expect(2);
        var o = Database.setObject("table", {test: "test"});
        test.strictEqual(o.id, 0, "Can not insert database object");
        test.notStrictEqual(Database.getById("table", o.id), null, "Object was inserted, but not found");
        test.done();
    },
    testFind(test) {
        test.expect(2);
        for(var c = 0; c<10; c++)
        {
            var o = Database.setObject("table", {"test": c+""});
        }
        test.ok(Database.findBy("table", "test", 5)) ;
        test.strictEqual(1, Database.findByMatchFilters("table", {"test":"5"}).length);
        test.done();
    },
    testWrite(test)
    {
        test.expect(1);
        Database.doSave(function() {
            test.ok(fs.statSync("db"));
            test.done();
        });
    },
    tearDown(callback)
    {
        try {
            fs.unlinkSync("db");
        }catch(e){}
        callback();
    }
};