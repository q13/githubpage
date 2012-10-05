/**
 * app.js.
 * User: q13
 * Date: 12-9-15
 * Time: 下午6:51
 */
var http = require('http');
var preConfig=require("./test/pre-config"),
    archive=require("./test/archive"),
    update=require("./test/update"),
    remove=require("./test/remove"),
    path=require("path");
//preConfig.test(path.resolve("example"));
archive.test(path.resolve("example"));
//update.test(path.resolve("example"));
//remove.test(path.resolve("example"));
/*http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Test for project\n');

}).listen(1337, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');*/
