# Githubpage

利用Github pages功能搭建静态博客

## 安装

    $ npm install githubpage

## 用法

#### 归档&&发布文档

在*.markdown源文件所在目录下运行

    githubpage --archive .

发布的html文件位于published路径下

#### 更新文档

在source归档目录下修改相应的markdown源文件，运行

    githubpage --update .

#### 删除文档

e.g.删除source/2012-10-01/page1.markdown源文件，运行

    githubpage --remove . 2012-10-01/page1

#### 切换主题

e.g.切换到bootstrap主题，运行

    githubpage --theme . bootstrap

## Demo

[我的pages](http://q13.github.com/).


## Credits

  - [q13](http://github.com/q13)

## License

(The MIT License)

Copyright (c) 2011 Jared Hanson

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.