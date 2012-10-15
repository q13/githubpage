/**
 * @author q13
 */
(function($,win){
    $(function($){
        var infoPath='/info.json';
        $.ajax({
            "type":"get",
            "dataType":"json",
            "url":infoPath,
            "success":function(data){
                var tid;
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
                $('<div class="tag-wrapper"></div>').appendTo(tagWrapperEl);
                $('.tag-wrapper',tagWrapperEl).jQCloud(tagArr);   
                $(win).resize(function(){
                    clearTimeout(tid);
                    tid=setTimeout(function(){
                        $('.tag-wrapper',tagWrapperEl).remove();
                        $('<div class="tag-wrapper"></div>').appendTo(tagWrapperEl);
                        $('.tag-wrapper',tagWrapperEl).jQCloud(tagArr); 
                    },600);  
                });
            }
        });
        //page索引展示控制
        (function(){
            var pageListEl=$('#page-list'),
                pageItemsEl=$('.page-item',pageListEl),
                perNum=13;
            var paginationBarEl=$('<div class="pagination-bar"></div>');
            paginationBarEl.html('<a href="#" class="more btn">查看下'+perNum+'条</a>&nbsp;&nbsp;<a href="#" class="whole btn">余下全部</a>');
            paginationBarEl.appendTo(pageListEl.parent());
            if(pageItemsEl.length<=perNum){
                pageItemsEl.show();      
                $('.more',paginationBarEl).hide();
                $('.whole',paginationBarEl).hide();
            }else{
                pageItemsEl.slice(0,perNum).show();
            }
            paginationBarEl.on('click','.more',function(){
                pageItemsEl.filter(':hidden').slice(0,perNum).show();
                if(pageItemsEl.filter(':hidden').length==0){
                    $('.more',paginationBarEl).hide(); 
                    $('.whole',paginationBarEl).text("收起");
                }        
                return false;
            });
            paginationBarEl.on('click','.whole',function(){
                if(pageItemsEl.filter(':hidden').length==0){
                    pageItemsEl.hide();
                    pageItemsEl.slice(0,perNum).show();
                    $('.more',paginationBarEl).show();
                    $('.whole',paginationBarEl).text("余下全部"); 
                }else{
                    pageItemsEl.show();
                }   
                return false;
            });
        }());
    });
    //代码高亮
    hljs.tabReplace = '    ';
    hljs.initHighlightingOnLoad();    
}(jQuery,this));

