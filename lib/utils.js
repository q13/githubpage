/**
 * utils.js.
 * User: q13
 * Date: 12-9-15
 * Time: 下午4:18
 */

/**
 * 获得指定目录下所有的文件
 * @param root
 * @return {Array}
 */

var _=require("underscore"),
    fs=require("fs");
function getAllFiles(root,deepLevel){
    var result = [],
        files = fs.readdirSync(root);
    var level=1;
    files.forEach(function(file) {
        var pathname = root+ "/" + file,
            stat = fs.lstatSync(pathname);
        if (stat === undefined) return;

        // 不是文件夹就是文件
        if (!stat.isDirectory()) {
            result.push(pathname);
            // 递归自身
        } else {
            if(deepLevel){
                if(deepLevel>level){
                    result = result.concat(getAllFiles(pathname));
                    level++;
                }
            }else{
                result = result.concat(getAllFiles(pathname));
                level++;
            }
        }
    });
    return result;
}
function filePipe(srcPath, dstPath){
    //获得srcpath及其子路径下的所有文件
    var files=getAllFiles(srcPath);
    files.forEach(function(filePath){
        var relPathStr=filePath.slice(srcPath.length+1),
            relPaths=relPathStr.split('/');
        //去掉最后一个文件名
        relPaths.pop();
        var tempPath="";
        relPaths.forEach(function(v){
            var realPath;
            tempPath+=v+'/';
            realPath=dstPath+'/'+tempPath.slice(0,-1);
            if(!fs.existsSync(realPath)){
                fs.mkdirSync(realPath);
            }
        });
        fs.writeFileSync(dstPath+'/'+relPathStr, fs.readFileSync(filePath));
        //fs.createReadStream(filePath).pipe(fs.createWriteStream(dstPath+'/'+relPathStr));
    });
}

//输出
_.extend(exports,{
    getAllFiles:getAllFiles,
    filePipe:filePipe,
    mix:function(receiver, supplier ){
        var args = Array.apply([], arguments ),i = 1, key,//如果最后参数是布尔，判定是否覆写同名属性
        ride = typeof args[args.length - 1] == "boolean" ? args.pop() : true;
        if(args.length === 1){//处理$.mix(hash)的情形
            receiver = !this.window ? this : {} ;
            i = 0;
        }
        while((supplier = args[i++])){
            for ( key in supplier ) {//允许对象糅杂，用户保证都是对象
                if (supplier.hasOwnProperty(key) && (ride || !(key in receiver))) {
                    receiver[ key ] = supplier[ key ];
                }
            }
        }
        return receiver;
    }
});
