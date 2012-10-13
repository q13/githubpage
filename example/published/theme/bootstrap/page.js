/**
 * @author q13
 */
jQuery(function($){
    var infoPath='/info.json';
    $.ajax({
        "type":"get",
        "dataType":"json",
        "url":infoPath,
        "success":function(data){
            var tagWrapperEl=$('#page-tag');
            var tagArr=[];
            var tagInfo=data.tag;
            $('[tagid]',tagWrapperEl).each(function(i){
                var linkEl=$('a',this),
                    tagId=$(this).attr("tagid");
                tagArr[i]={
                    text: tagId, 
                    weight: tagInfo.filter(function(item){
                        return item.tagName==tagId;
                    })[0].pageNum, 
                    link: linkEl.attr('href')
                };
            });
            tagWrapperEl.jQCloud(tagArr);   
        }
    });
});
//代码高亮
hljs.tabReplace = '    ';
hljs.initHighlightingOnLoad();
