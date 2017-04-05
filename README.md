# pth5upload

- 2017-4-05 支持base64上传

配置说明

```
     * opt.uploadUrl=''                                 上传服务器
     * opt.onSelect=function()                          文件选择回调
     * opt.onSelectBefore=function(所有选择的文件数组)    文件选择加入文件队列之前回调，如果返回false ,则停止文件加入队列
     * opt.onAddFileBefore=function()                   文件加入队列之前回调，返回false 则不加入队列
     * opt.onAddFile=function()                         添加文件后的回调函数
     * opt.onUploadBefore=function()                    上传开始之前事件，如果返回false，则不会执行不上传，返回true 继续往下执行
     * opt.autoUpload=false|true                    自动上传
     * opt.uploadSuccess=function()                 上传成功回调,只是正常返回200状态，具体成功与否，由回调函数判断，并返回false 时，文件对象不会从队列中删除。否则默认会从队列中删除文件对象
     * opt.uploadError=function(文件对象，e对象)                   上传错误回调
     * opt.error=function(code,msg)                 错误异常回调
     * opt.onProgress=function(progress,xhl)        进度回调
     * opt.onStartSend=function(ajax)               发送上传之前事件回调
     * opt.onUploadComplete=function(文件对象)       单个上传请求完成后回调，上传完成不代表上传成功
     * opt.onAllUploadComplete=function()    所有文件上传请求完成后回调，上传完成不代表上传成功
     * opt.accept='image/*'         选择文件类型
     * opt.selectImageBtn='';       选择图片按钮 selector
     * opt.maxLength=50             本次上传的最多文件
     * opt.debug=false;
     * opt.params={}                自定义上传的from 参数
     * opt.multiple = false         选择多个文件
     * opt.imageFileField='file'    图片文件字段名
     * opt.accept_type=''           接受的文件类型,多个类型用’,‘隔开，如何'jpg,gif,png'，为空，表示不限制类型
     * opt.fileMaxSize=0            上传的文件大小的最大值，默认0为不限制，单位kb
     * opt.uploadingSize=3                          //同时上传的图片数量，默认3个文件
     * opt.xhrFields ={}            自定义选项
     * opt.uploadContentType ='file'            图片上传数据类型： file 文件形式上传;base64 以base64 数据上传
```