/**
 * @author q13
 */
jQuery(function($){
    var tagWrapperEl=$('#page-tag');
    var tagArr=[];
    $('[tagid]',tagWrapperEl).each(function(i){
        var linkEl=$('a',this);
        tagArr[i]={
            text: linkEl.text(), 
            weight: 13, 
            link: linkEl.attr('href')
        };
    });
    tagWrapperEl.jQCloud(tagArr);
});
