var Database = require("../backend/Database");

exports.testInsert = function(test) {
    test.expect(2);
    var o = Database.setObject("table", {test:"test"});
    test.ok(test.strictEqual(o.id, 0), "Can not insert database object");
    test.ok(test.notStrictEqual(Database.getById(o.id), null), "Object was inserted, but not found");
    test.done();
};