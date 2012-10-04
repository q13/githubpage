/**
 * core.js.
 * User: q13
 * Date: 12-9-15
 * Time: 下午3:56
 */

var fs=require("fs"),
    moment=require("moment"),
    //jsdom=require("jsdom"),
    //markdown=require( "markdown").markdown,
    $=require("jQuery"),
    metamd=require("metamd"),
    ejs=require("ejs"),
    path=require("path"),
    crypto = require('crypto'),
    utils=require("./lib/utils");
var tplPath=path.normalize(__dirname+"/tpl");
var core={
    /**
     * 前期准备，结构搭建
     * @param basePath
     */
    preConfig:function(basePath){
        var todayDirName=moment().format("YYYY-MM-DD");
        var layoutContent;
        var files={
                "dir":["source","source/"+todayDirName,"published","published/pages","published/pages/"+todayDirName,"published/cates","published/tags","published/theme"],
                "file":["cate.json","tag.json","published/index.html","checksum.json"]
            },
            configPath=basePath+"/config.json",
            themePath=basePath+"/published/theme";
        var config;
        var serverHref={
            "BASE":"/",
            "THEME":"",
            "CATES":"/cates",
            "TAGS":"/tags"
        };
        //创建config.json
        if(!fs.existsSync(configPath)){
            fs.writeFileSync(basePath+'/config.json', fs.readFileSync(tplPath+'/config.json', "utf8"), "utf8");
            //stream方式文件拷贝,pipe传输是异步的不靠谱
            //fs.createReadStream(path.normalize(tplPath+'/config.json')).pipe(fs.createWriteStream(path.normalize(basePath+'/config.json')));
        }
        config=JSON.parse(fs.readFileSync(configPath, "utf8"));
        serverHref["THEME"]="/theme/"+config.theme;
        //将serverHref揉杂到config中
        utils.mix(config,serverHref);
        //创建预设dir和file
        layoutContent=fs.readFileSync(tplPath+'/'+config.theme+"/layout.ejs","utf8");
        files.dir.forEach(function(v,i){
            var dirPath= basePath+'/'+v;
            if(!fs.existsSync(dirPath)){
                fs.mkdirSync(dirPath);
            }
        });
        files.file.forEach(function(v,i){
            var filePath= basePath+'/'+ v,
                fileContent;
            if(!fs.existsSync(filePath)){
                if(v=="cate.json"||v=="tag.json"){
                    fileContent='{"items":[]}';
                }else if(v=="published/index.html"){
                    fileContent=ejs.render(layoutContent, {
                        page:{
                            content:'<ul id="page-list"></ul>',
                            tag:"&nbsp;",
                            cate:"&nbsp;"
                        },
                        BASEHREF:config.BASE,
                        THEMEHREF:config.THEME
                    });
                }else if(v=="checksum.json"){
                    fileContent='{"items":[]}';
                }else{
                    fileContent="&nbsp;";
                }
                //同步方式创建
                fs.writeFileSync(filePath,fileContent,"utf8");
            }
        });
        //主题配置
        themePath+="/"+config.theme;
        if(!fs.existsSync(themePath)){
            fs.mkdirSync(themePath);
        }
        utils.filePipe(tplPath+'/'+config.theme+'/resources',themePath);
        //返回配置项
        return config;
    },
    archive:function(basePath,pageMds){
        var config,
            layoutContent,
            metaTplData={
                "cate":null,
                "tag":null
            },
            catePath=basePath+'/published/cates',
            tagPath=basePath+'/published/tags',
            indexPath=basePath+'/published/index.html',
            checksumPath=basePath+'/checksum.json';
        var todayDirName=moment().format("YYYY-MM-DD");
        //准备page path
        if(pageMds){
            if(!Array.isArray(pageMds)){
                pageMds=[basePath+'/'+pageMds];
            }else{
                pageMds=pageMds.map(function(pagePath){
                    return basePath+'/'+pagePath;
                });
            }
        }else{
            //取得basePath下的所有page markdown
            pageMds=utils.getAllFiles(basePath,1).filter(function(pagePath){
                if(path.extname(pagePath,1).slice(1)=="markdown"){
                    return true;
                }
            });
        }
        //pre config
        config=core.preConfig(basePath);
        //生成html输出
        //layoutContent=fs.readFileSync(tplPath+'/'+config.theme+"/layout.html","utf8");
        layoutContent=fs.readFileSync(tplPath+'/'+config.theme+"/layout.ejs","utf8");
        metaTplData.cate=JSON.parse(fs.readFileSync(basePath+'/'+"cate.json","utf8"));
        metaTplData.tag=JSON.parse(fs.readFileSync(basePath+'/'+"tag.json","utf8"));
        pageMds.forEach(function(pagePath){
            var mdContent=fs.readFileSync(pagePath,"utf8"),
                pageInfo=metamd(mdContent),
                pageContent=pageInfo.getHtml(),
                pageMeta=pageInfo.getData();
            var pageName=path.basename(pagePath, '.markdown'),
                pageId=todayDirName+'/'+pageName,
                pageRenderStr;
            var cateChanged=false,
                tagChanged=false,
                cateStr="",
                tagStr="",
                cateDocEl,
                tagDocEl,
                indexDocEl;
            var archMdPath;
            var curReadyPages=utils.getAllFiles(basePath+'/published/pages');   //现有的page
            curReadyPages=curReadyPages.concat(utils.getAllFiles(catePath));   //add cates
            curReadyPages=curReadyPages.concat(utils.getAllFiles(tagPath));    //add tags
            curReadyPages.push(indexPath); //add index.html
            //更新cate和tag导航
            if(metaTplData.cate.items.indexOf(pageMeta.cate)==-1){
                metaTplData.cate.items.push(pageMeta.cate);
                //重新写入
                fs.writeFileSync(basePath+'/'+"cate.json",JSON.stringify(metaTplData.cate),"utf8");
                cateChanged=true;
            }
            if(metaTplData.tag.items.indexOf(pageMeta.tag)==-1){
                metaTplData.tag.items.push(pageMeta.tag);
                //重新写入
                fs.writeFileSync(basePath+'/'+"tag.json",JSON.stringify(metaTplData.tag),"utf8");
                tagChanged=true;
            }
            metaTplData.cate.items.forEach(function(item){
                cateStr+='<li cateid="'+item+'"><a href="'+config.CATES+'/'+item+'.html">'+item+'</a></li>';
            });
            cateStr='<ul id="cate-list">'+cateStr+'</ul>';
            metaTplData.tag.items.forEach(function(item){
                tagStr+='<li tagid="'+item+'"><a href="'+config.TAGS+'/'+item+'.html">'+item+'</a></li>';
            });
            tagStr='<ul id="tag-list">'+tagStr+'</ul>';
            pageRenderStr=ejs.render(layoutContent, {
                page:{
                    content:pageContent,
                    tag:tagStr,
                    cate:cateStr
                },
                BASEHREF:config.BASE,
                THEMEHREF:config.THEME
            });
            fs.writeFileSync(basePath+"/published/pages/"+todayDirName+'/'+pageName+".html",pageRenderStr,"utf8");
            //将md放到source目录下，以时间分类
            archMdPath= basePath+"/source/"+todayDirName+'/'+pageName+".markdown";
            fs.renameSync(pagePath,archMdPath);
            //添加checksum
            core.addChecksum(archMdPath,checksumPath);
            //替换已有文件的cate and tag
            if(cateChanged||tagChanged){
                //替换现有的html cate或tag部分
                curReadyPages.forEach(function(curReadyPage){
                    /*jsdom.env({
                        html: curReadyPage,
                        scripts: [],
                        done: function(errors, win) {
                            if(cateChanged){
                                win.document.getElementById("page-cate").innerHTML= cateStr;
                            }
                            if(tagChanged){
                                win.document.getElementById("page-tag").innerHTML= tagStr;
                            }
                            fs.writeFileSync(curReadyPage,win.document.innerHTML,"utf8");
                        }
                    });*/
                    //var docEl=$(fs.readFileSync(curReadyPage,"utf8"));
                    var docEl=core.getDocEl(fs.readFileSync(curReadyPage,"utf8"));
                    //重新设置cate
                    if(cateChanged){
                        docEl.find("#page-cate").html(cateStr);
                    }
                    if(tagChanged){
                        docEl.find("#page-tag").html(tagStr);
                    }
                    //写回文件
                    //fs.writeFileSync(curReadyPage,core.addDoctype(docEl.html()),"utf8");
                    fs.writeFileSync(curReadyPage,core.addDoctype(core.getDocHtmlStr(docEl)),"utf8");
                });
            }
            //生成新的cate或更新现有cate索引文件
            if(cateChanged){
                pageRenderStr=ejs.render(layoutContent, {
                    page:{
                        content:'<ul id="page-list"><li pageid="'+pageId+'">'+pageMeta.summary+'</li></ul>',
                        tag:tagStr,
                        cate:cateStr
                    },
                    BASEHREF:config.BASE,
                    THEMEHREF:config.THEME
                });
                fs.writeFileSync(catePath+'/'+pageMeta.cate+".html",pageRenderStr,"utf8");
            }else{
                //cateDocEl=$(fs.readFileSync(catePath+'/'+pageMeta.cate+".html","utf8"));
                cateDocEl=core.getDocEl(fs.readFileSync(catePath+'/'+pageMeta.cate+".html","utf8"));
                $('<li pageid="'+pageId+'">'+pageMeta.summary+'</li>').appendTo($('#page-list',cateDocEl));
                //写回文件
                //fs.writeFileSync(catePath+'/'+pageMeta.cate+".html",core.addDoctype(cateDocEl.html()),"utf8");
                fs.writeFileSync(catePath+'/'+pageMeta.cate+".html",core.addDoctype(core.getDocHtmlStr(cateDocEl)),"utf8");
            }
            //生成新的tag或更新现有tag索引文件
            if(tagChanged){
                pageRenderStr=ejs.render(layoutContent, {
                    page:{
                        content:'<ul id="page-list"><li pageid="'+pageId+'">'+pageMeta.summary+'</li></ul>',
                        tag:tagStr,
                        cate:cateStr
                    },
                    BASEHREF:config.BASE,
                    THEMEHREF:config.THEME
                });
                fs.writeFileSync(tagPath+'/'+pageMeta.tag+".html",pageRenderStr,"utf8");
            }else{
                //tagDocEl=$(fs.readFileSync(tagPath+'/'+pageMeta.tag+".html","utf8"));
                tagDocEl=core.getDocEl(fs.readFileSync(tagPath+'/'+pageMeta.tag+".html","utf8"));
                $('<li pageid="'+pageId+'">'+pageMeta.summary+'</li>').appendTo($('#page-list',tagDocEl));
                //写回文件
                //fs.writeFileSync(tagPath+'/'+pageMeta.tag+".html",core.addDoctype(tagDocEl.html()),"utf8");
                fs.writeFileSync(tagPath+'/'+pageMeta.tag+".html",core.addDoctype(core.getDocHtmlStr(tagDocEl)),"utf8");
            }
            //更新index索引文件
            //indexDocEl=$(fs.readFileSync(indexPath,"utf8"));
            indexDocEl=core.getDocEl(fs.readFileSync(indexPath,"utf8"));
            $('<li pageid="'+pageId+'">'+pageMeta.summary+'</li>').appendTo($('#page-list',indexDocEl));
            //写回文件
            //fs.writeFileSync(indexPath,core.addDoctype(indexDocEl.html()),"utf8");
            fs.writeFileSync(indexPath,core.addDoctype(core.getDocHtmlStr(indexDocEl)),"utf8");
        });
    },
    update:function(basePath,pageMds){
        var sourcePath=basePath+"/source",
            checksumPath=basePath+"/checksum.json",
            checksum=JSON.parse(fs.readFileSync(checksumPath, "utf8"));
        //pre config
        var config=core.preConfig(basePath);
        var layoutContent=fs.readFileSync(tplPath+'/'+config.theme+"/layout.ejs","utf8"),
            metaTplData={
                "cate":null,
                "tag":null
            },
            catePath=basePath+'/published/cates',
            tagPath=basePath+'/published/tags',
            indexPath=basePath+'/published/index.html';
        //准备page path
        if(pageMds){
            if(!Array.isArray(pageMds)){
                pageMds=[sourcePath+'/'+pageMds];
            }else{
                pageMds=pageMds.map(function(pagePath){
                    return sourcePath+'/'+pagePath;
                });
            }
        }else{
            //取得sources下的所有已更改的page markdown
            pageMds=utils.getAllFiles(sourcePath).filter(function(pagePath){
                var md5;
                if(path.extname(pagePath,1).slice(1)=="markdown"){
                    md5=core.getChecksum(pagePath);
                    return checksum.items.some(function(item){
                        if(item.path==pagePath&&item.md5!=md5){
                            return true;
                        }
                    });
                }
            });
        }
        metaTplData.cate=JSON.parse(fs.readFileSync(basePath+'/'+"cate.json","utf8"));
        metaTplData.tag=JSON.parse(fs.readFileSync(basePath+'/'+"tag.json","utf8"));

        pageMds.forEach(function(pagePath){
            //重新替换published page
            var mdContent=fs.readFileSync(pagePath,"utf8"),
                pageInfo=metamd(mdContent),
                pageContent=pageInfo.getHtml(),
                pageMeta=pageInfo.getData();
            var pageName=path.basename(pagePath, '.markdown'),
                fullPageName=path.basename(pagePath),
                curDirName=pagePath.slice(-(fullPageName.length+11),-(fullPageName.length+1)),
                pageId=curDirName+'/'+pageName,
                pageRenderStr;
            var cateChanged=false,
                tagChanged=false,
                cateStr="",
                tagStr="",
                cateDocEl,
                tagDocEl,
                indexDocEl;
            var pageItemEl,
                catePagePaths,
                tagPagesPaths;
            var curReadyPages=utils.getAllFiles(basePath+'/published/pages');   //现有的page
            curReadyPages=curReadyPages.concat(utils.getAllFiles(catePath));   //add cates
            curReadyPages=curReadyPages.concat(utils.getAllFiles(tagPath));    //add tags
            curReadyPages.push(indexPath); //add index.html
            //更新cate和tag导航
            if(metaTplData.cate.items.indexOf(pageMeta.cate)==-1){
                metaTplData.cate.items.push(pageMeta.cate);
                //重新写入
                fs.writeFileSync(basePath+'/'+"cate.json",JSON.stringify(metaTplData.cate),"utf8");
                cateChanged=true;
            }
            if(metaTplData.tag.items.indexOf(pageMeta.tag)==-1){
                metaTplData.tag.items.push(pageMeta.tag);
                //重新写入
                fs.writeFileSync(basePath+'/'+"tag.json",JSON.stringify(metaTplData.tag),"utf8");
                tagChanged=true;
            }
            metaTplData.cate.items.forEach(function(item){
                cateStr+='<li cateid="'+item+'"><a href="'+config.CATES+'/'+item+'.html">'+item+'</a></li>';
            });
            cateStr='<ul id="cate-list">'+cateStr+'</ul>';
            metaTplData.tag.items.forEach(function(item){
                tagStr+='<li tagid="'+item+'"><a href="'+config.TAGS+'/'+item+'.html">'+item+'</a></li>';
            });
            tagStr='<ul id="tag-list">'+tagStr+'</ul>';
            pageRenderStr=ejs.render(layoutContent, {
                page:{
                    content:pageContent,
                    tag:tagStr,
                    cate:cateStr
                },
                BASEHREF:config.BASE,
                THEMEHREF:config.THEME
            });
            fs.writeFileSync(basePath+"/published/pages/"+curDirName+'/'+pageName+".html",pageRenderStr,"utf8");
            //更新checksum
            core.updateChecksum(pagePath,checksumPath);
            //替换已有文件的cate and tag
            if(cateChanged||tagChanged){
                //替换现有的html cate或tag部分
                curReadyPages.forEach(function(curReadyPage){
                    var docEl=core.getDocEl(fs.readFileSync(curReadyPage,"utf8"));
                    //重新设置cate
                    if(cateChanged){
                        docEl.find("#page-cate").html(cateStr);
                    }
                    if(tagChanged){
                        docEl.find("#page-tag").html(tagStr);
                    }
                    //写回文件
                    fs.writeFileSync(curReadyPage,core.addDoctype(core.getDocHtmlStr(docEl)),"utf8");
                });
            }
            //生成新的cate或更新现有cate索引文件
            if(cateChanged){
                pageRenderStr=ejs.render(layoutContent, {
                    page:{
                        content:'<ul id="page-list"><li pageid="'+pageId+'">'+pageMeta.summary+'</li></ul>',
                        tag:tagStr,
                        cate:cateStr
                    },
                    BASEHREF:config.BASE,
                    THEMEHREF:config.THEME
                });
                fs.writeFileSync(catePath+'/'+pageMeta.cate+".html",pageRenderStr,"utf8");
            }else{
                cateDocEl=core.getDocEl(fs.readFileSync(catePath+'/'+pageMeta.cate+".html","utf8"));
                //pageItemEl=$('#page-list [pageid]="'+pageName+'"',cateDocEl);
                pageItemEl=cateDocEl.find('#page-list [pageid="'+pageId+'"]');
                if(pageItemEl.length==0){
                    $('<li pageid="'+pageId+'">'+pageMeta.summary+'</li>').appendTo($('#page-list',cateDocEl));
                    //删除原所属cate对应page item
                    catePagePaths=utils.getAllFiles(catePath).filter(function(catePagePath){
                        return catePagePath!=catePath+'/'+pageMeta.cate+".html";
                    });
                    catePagePaths.forEach(function(catePagePath){
                        var cateDocEl=core.getDocEl(fs.readFileSync(catePagePath,"utf8")),
                            //pageItemEl=$('[pageid]="'+pageName+'"',cateDocEl);
                            pageItemEl=cateDocEl.find('#page-list [pageid="'+pageId+'"]');
                        if(pageItemEl.length>0){
                            pageItemEl.remove();
                            //写回文件
                            fs.writeFileSync(catePagePath,core.addDoctype(core.getDocHtmlStr(cateDocEl)),"utf8");
                        }
                    });
                }
                pageItemEl.text(pageMeta.summary);
                //写回文件
                fs.writeFileSync(catePath+'/'+pageMeta.cate+".html",core.addDoctype(core.getDocHtmlStr(cateDocEl)),"utf8");
            }
            //生成新的tag或更新现有tag索引文件
            if(tagChanged){
                pageRenderStr=ejs.render(layoutContent, {
                    page:{
                        content:'<ul id="page-list"><li pageid="'+pageId+'">'+pageMeta.summary+'</li></ul>',
                        tag:tagStr,
                        cate:cateStr
                    },
                    BASEHREF:config.BASE,
                    THEMEHREF:config.THEME
                });
                fs.writeFileSync(tagPath+'/'+pageMeta.tag+".html",pageRenderStr,"utf8");
            }else{
                tagDocEl=core.getDocEl(fs.readFileSync(tagPath+'/'+pageMeta.tag+".html","utf8"));
                //pageItemEl=$('#page-list [pageid]="'+pageName+'"',tagDocEl);
                pageItemEl=tagDocEl.find('#page-list [pageid="'+pageId+'"]');
                if(pageItemEl.length==0){
                    $('<li pageid="'+pageId+'">'+pageMeta.summary+'</li>').appendTo($('#page-list',tagDocEl));
                    //删除原所属cate对应page item
                    tagPagePaths=utils.getAllFiles(tagPath).filter(function(tagPagePath){
                        return tagPagePath!=tagPath+'/'+pageMeta.tag+".html";
                    });
                    tagPagePaths.forEach(function(tagPagePath){
                        var tagDocEl=core.getDocEl(fs.readFileSync(tagPagePath,"utf8")),
                            //pageItemEl=$('[pageid]="'+pageName+'"',tagDocEl);
                            pageItemEl=tagDocEl.find('#page-list [pageid="'+pageId+'"]');
                        if(pageItemEl.length>0){
                            pageItemEl.remove();
                            //写回文件
                            fs.writeFileSync(tagPagePath,core.addDoctype(core.getDocHtmlStr(tagDocEl)),"utf8");
                        }
                    });
                }
                pageItemEl.text(pageMeta.summary);
                //写回文件
                fs.writeFileSync(tagPath+'/'+pageMeta.tag+".html",core.addDoctype(core.getDocHtmlStr(tagDocEl)),"utf8");
            }
            //更新index索引文件
            indexDocEl=core.getDocEl(fs.readFileSync(indexPath,"utf8"));
            //pageItemEl=$('[pageid]="'+pageName+'"',indexDocEl);
            pageItemEl=indexDocEl.find('#page-list [pageid="'+pageId+'"]');
            if(pageItemEl.length>0){
                pageItemEl.text(pageMeta.summary);
                //写回文件
                fs.writeFileSync(indexPath,core.addDoctype(core.getDocHtmlStr(indexDocEl)),"utf8");
            }
        });

    },
    remove:function(basePath,pageMds){
         var sourcePath=basePath+"/source",
            pageHtmlPath=basePath+'/published/pages',
            catePath=basePath+'/published/cates',
            tagPath=basePath+'/published/tags',
            indexPath=basePath+'/published/index.html',
            checksumPath=basePath+"/checksum.json";
        //准备page path
        if(pageMds){
            if(!Array.isArray(pageMds)){
                pageMds=[sourcePath+'/'+pageMds];
            }else{
                pageMds=pageMds.map(function(pagePath){
                    return sourcePath+'/'+pagePath;
                });
            }
        }else{
            //取得sources下的所有已更改的page markdown
            pageMds=utils.getAllFiles(sourcePath);
        }
        pageMds.forEach(function(pagePath){
            var mdContent=fs.readFileSync(pagePath,"utf8"),
                pageInfo=metamd(mdContent),
                pageMeta=pageInfo.getData();
                
            var cateDocEl,tagDocEl,indexDocEl,pageItemEl;
                
            var pageName=path.basename(pagePath, '.markdown'),
                fullPageName=path.basename(pagePath),
                curDirName=pagePath.slice(-(fullPageName.length+11),-(fullPageName.length+1)),
                pageHtmlRelPath=curDirName+'/'+pageName,
                pageId=curDirName+'/'+pageName;
                //删除对应的page html
                fs.unlinkSync(pageHtmlPath+'/'+pageHtmlRelPath+'.html');
                //删除 checksum.json中对应的配置
                core.deleteChecksum(pagePath,checksumPath);
                //删除cate,tag,index中对应的索引
                cateDocEl=core.getDocEl(fs.readFileSync(catePath+'/'+pageMeta.cate+".html","utf8"));
                pageItemEl=cateDocEl.find('#page-list [pageid="'+pageId+'"]');
                if(pageItemEl.length>0){
                    pageItemEl.remove();
                    //写回文件
                    fs.writeFileSync(catePath+'/'+pageMeta.cate+".html",core.addDoctype(core.getDocHtmlStr(cateDocEl)),"utf8");   
                }
                tagDocEl=core.getDocEl(fs.readFileSync(tagPath+'/'+pageMeta.tag+".html","utf8"));
                pageItemEl=tagDocEl.find('#page-list [pageid="'+pageId+'"]');
                if(pageItemEl.length>0){
                    pageItemEl.remove();
                    //写回文件
                    fs.writeFileSync(tagPath+'/'+pageMeta.tag+".html",core.addDoctype(core.getDocHtmlStr(tagDocEl)),"utf8");   
                }
                indexDocEl=core.getDocEl(fs.readFileSync(indexPath,"utf8"));
                pageItemEl=indexDocEl.find('#page-list [pageid="'+pageId+'"]');
                if(pageItemEl.length>0){
                    pageItemEl.remove();
                    //写回文件
                    fs.writeFileSync(indexPath,core.addDoctype(core.getDocHtmlStr(indexDocEl)),"utf8");   
                }
         });
    },
    theme:function(){
        //TODO 自定义主题切换
    },
    addDoctype:function(htmlStr){
        return '<!DOCTYPE html><html>'+htmlStr+'</html>';   //<!DOCTYPE html>之间不能有空格，否则会解析错误<html>
    },
    getChecksum:function(filePath){
        var buffer=fs.readFileSync(filePath);
        var shasum = crypto.createHash('md5');
        return shasum.update(buffer).digest('hex');
    },
    addChecksum:function(filePath,checksumPath){
        var checksum=JSON.parse(fs.readFileSync(checksumPath, "utf8")),
            code=core.getChecksum(filePath);
        checksum.items.push({
            "path":filePath,
            "md5":code
        });
        //写回文件
        fs.writeFileSync(checksumPath,JSON.stringify(checksum),"utf8");
    },
    updateChecksum:function(filePath,checksumPath){
        var checksum=JSON.parse(fs.readFileSync(checksumPath, "utf8")),
            code=core.getChecksum(filePath);
        var exist=checksum.items.some(function(item){
            if(item.path==filePath){
                item.md5=code;
                return true;
            }
        });
        if(exist===true){
            //写回文件
            fs.writeFileSync(checksumPath,JSON.stringify(checksum),"utf8");    
        }else{
            core.addChecksum(filePath,checksumPath);
        }
    },
    deleteChecksum:function(filePath,checksumPath){
        var checksum=JSON.parse(fs.readFileSync(checksumPath, "utf8"));
        checksum.items=checksum.items.filter(function(item){
            return (item.path!=filePath);
        });
        //写回文件
        fs.writeFileSync(checksumPath,JSON.stringify(checksum),"utf8");
    },
    getDocEl:function(htmlStr){
        return $(htmlStr.replace('<script','<!--%%%<script').replace('</script>','</script>%%%-->'));    
    },
    getDocHtmlStr:function(docEl){
        return docEl.html().replace('<!--%%%<script','<script').replace('</script>%%%-->','</script>');    
    }
};

module.exports=exports=core;