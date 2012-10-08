#!/usr/bin/env node
var core=require("../core"),
    path=require("path");
var args=process.argv.slice(0),
    command=args[2].slice(2);
    
// shift off node and script name and command
args.shift(); args.shift();args.shift();
if(args.length==0){ //默认使用当前路径
    args.push('.');
}
args[0]=path.resolve(args[0]);
core[command].apply(core,args);
//core[command](args.join(','));
