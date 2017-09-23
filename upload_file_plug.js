(
    function ( global , factory ) {
        typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define( factory ) : (
            global.ptH5upload = factory()
        );
    }( this , function () {
        
        var ptH5upload = function () {
            var _t = this;
            /**
             * 错误处理与回调
             * @param code
             * @param msg
             */
            _t.throwError = function ( code , msg ) {
                
                msg = msg || _t.error_msg[ code ] || false;
                if ( _t.opt.debug ) {
                    console.log( 'error_code :' + code );
                    console.log( 'error_message :' + msg );
                }
                if ( _t.isFunction( _t.opt.error ) ) {
                    _t.opt.error( code , msg );
                } else {
                    throw new Error( msg , code );
                }
                
            };
            this.upload_success_number = 0;
            this.upload_fail_number    = 0;
            this.id_index              = 0;//文件ID索引
            this.uploaded_index        = 0;
            this.imageFile             = {};
            this.loadStatus            = '';
            this.loadingNumber         = 0;//当前正在上传中的数量
            this.loadedList            = {};//已上传的文件
            this.version               = '0.4';
            /**
             *
             * @param $this
             * @param opt
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
             * opt.setBase64Before =function()          对base64 内容处理二次处理,返回给插件
             */
            this.upload = function ( $this , opt ) {
                
                _t.initOptions( opt );
                /**
                 * 文件队列
                 * @type {Array}
                 */
                _t.inputFile = $( document.createElement( 'input' ) );
                _t.inputFile.attr( 'type' , 'file' );
                //_t.inputFile.appendTo( $('#test_img') );
                _t.inputFile.hide();
                _t.selectImg = $( _t.opt.selectImageBtn , $this );
                _t.inputFile.attr( 'accept' , _t.opt.accept );
                if ( opt.multiple ) _t.inputFile.attr( 'multiple' , 'multiple' );
                _t.selectImg.click( function () {
                    _t.inputFile.trigger( 'click' )
                } );
                //选择文件事件
                _t.inputFile.change( function () {
                    _t.inputFileChange( this );
                } );
            };
            /**
             * 修改单项配置
             * @param key
             * @param value
             */
            this.setOptionByKey = function ( key , value ) {
                this.opt[ key ] = value;
            };
            /**
             * 设置所有配置
             * @param opt
             */
            this.setOption = function ( opt ) {
                if ( opt ) {
                    this.initOptions( opt );
                }
            };
            /**
             * 获取配置，
             * @returns {*}
             */
            this.getOption = function ( key ) {
                if ( key ) {
                    return this.opt[ key ];
                }
                return this.opt;
            };
            this.randomStn = function ( len ) {
                len = len || 32;
                var $chars = 'ABCDEFGHJKMNPQROSTWXYLZabcdefhijkOlmnprstwxyz12345678';
                var maxPos = $chars.length;
                var pwd = '';
                for ( i = 0 ; i < len ; i++ ) {
                    pwd += $chars.charAt( Math.floor( Math.random() * maxPos ) );
                }
                return pwd;
            };
            /**
             * 文件选择事件处理
             * @param inputFile
             * @returns {boolean}
             */
            this.inputFileChange = function ( inputFile ) {
                try {
                    if ( _t.opt.maxLength < _t.getQueueCount() ) {
                        _t.throwError( _t.error_code.maxLength );
                        return false;
                    }
                    //如果返回false ,则停止文件加入队列
                    if ( _t.opt.onSelectBefore && _t.isFunction( _t.opt.onSelectBefore ) ) {
                        if ( _t.opt.onSelectBefore( inputFile.files ) === false )return false;
                    }
                    //添加到文件队列
                    for ( var i = 0 ; i < inputFile.files.length ; i++ ) {
                        var _fileObj = inputFile.files[ i ];
                        if ( _t.opt.onAddFileBefore && _t.isFunction( _t.opt.onAddFileBefore ) ) {
                            if ( _t.opt.onAddFileBefore( _fileObj ) === false )continue;//返回false ，则不加入队列
                        }
                        _fileObj.id = _t.id_index;
                        _fileObj._hashId=this.randomStn();
                        //如果是图片的，就转换成本地url
                        if (_fileObj.type &&  /image\//.test( _fileObj.type ) ) {
                            _fileObj.localUrl = window.URL.createObjectURL( _fileObj );//本地图片显示资源
                        }
                        
                        if ( _t.chkAcceptType( _fileObj ) ) {
                            if ( (
                                    _t.opt.fileMaxSize > 0 && _t.chkAcceptSize( _fileObj ) || _t.opt.fileMaxSize == 0
                                ) ) {
                                _t.imageFile[ _t.id_index ] = _fileObj;
                                
                                if ( _t.isFunction( _t.opt.onAddFile ) ) _t.opt.onAddFile( _fileObj );//添加文件回调事件
                                _t.id_index++;
                            } else {
                                if ( _t.throwError( _t.error_code.fileMaxSizeParam_invalid ) === false ) {
                                    return false;
                                }
                            }
                        } else {
                            _t.throwError( _t.error_code.not_allow_type );
                        }
                    }
                    if ( _t.opt.debug ) {
                        console.log( _t.imageFile );
                    }
                    if ( _t.isFunction( _t.opt.onSelect ) ) _t.opt.onSelect( _t.imageFile );//选择文件回调事件
                    //如果是base64上传的，
                    if(_t.opt.uploadContentType=='base64'){
                        var reader = new FileReader();
                        reader.readAsDataURL(_fileObj);
                        reader.onload = function(e){
                            //转成base64
                            if(_t.isFunction(_t.opt.setBase64Before)){
                                _t.imageFile[ _t.id_index ].base64 = _t.opt.setBase64Before(this.result)
                                
                            }else{
                                _t.imageFile[ _t.id_index ].base64 = this.result;
                                
                            }
                            this.result = null;
                            _t.id_index++;
                            if ( _t.opt.autoUpload && _t.loadingNumber === 0 ) _t.doUpload();//自动上传
                        }
                    }else{
                        //_t.id_index++;
                        if ( _t.opt.autoUpload && _t.loadingNumber === 0 ) _t.doUpload();//自动上传
                    }
                } catch ( e ) {
                    _t.throwError( null , e.message );
                }
                
            };
            
            /**
             * 检测文件大小
             * opt.fileMaxSize <= 0 时不检测大小
             */
            this.chkAcceptSize = function ( file ) {
                
                var _size = file.size;
                if ( _size > 0 ) {
                    if ( _size <= _t.opt.fileMaxSize * 1024 ) {
                        return true;
                    } else {
                        _t.throwError( _t.error_code.file_size_error_big );
                        return false;
                    }
                } else {
                    _t.throwError( _t.error_code.file_size_error );
                    return false;
                }
                
            };
            
            /**
             * 检测请允许的文件类型
             * accept_type 为空，表示不限制类型
             */
            this.chkAcceptType = function ( file ) {
                if ( _t.opt.debug ) console.log( file );
                var type_arr = file.type.split( '/' );
                var fileType = type_arr[ 1 ];
                if ( this.opt.accept_type != '' ) {
                    this._accept_arr = this.opt.accept_type.split( ',' );
                    for ( var j in this._accept_arr ) {
                        if ( fileType == this._accept_arr[ j ] ) {
                            return true;
                        }
                    }
                    return false;
                } else {
                    return true;
                }
            };
            /**
             * 获取文件类型
             * @param file
             * @returns {*}
             */
            this.getFileType = function ( file ) {
                try {
                    if ( file )return file.type;
                } catch ( e ) {
                    _t.throwError( e.message );
                }
            };
            
            /**
             * 上传处理
             * 单个图片上传
             */
            this.doUpload = function () {
                _t.stopUploadToken = false;//停止上传标记
                if ( _t.getQueueCount() == 0 ) {
                    _t.throwError( _t.error_code.notFile );
                    return false;
                }
                
                var j = 1;
                for ( var i in _t.imageFile ) {
                    var _uploadFile = _t.imageFile[ i ];
                    if ( typeof _uploadFile == 'object' ) {
                        this._uploadFile( _uploadFile );
                        if ( j == _t.opt.uploadingSize ) {
                            break;
                        }
                        j++;
                        _t.uploaded_index++;
                    }
                }
                
            };
            /**
             * 上传下一个文件
             */
            this._uploadNext = function () {
                this.uploaded_index++;
                var file = _t.imageFile[ _t.uploaded_index ];
                if ( _t.uploaded_index == _t.id_index ) _t.loadStatus = 'complete';
                if ( file ) {
                    this._uploadFile( file );
                    this.log( '下一个文件 id：' + file.id );
                } else {
                    this.uploaded_index--;
                    this.log( '队列已获取完成' );
                }
            };
            
            this.log = function ( info ) {
                if ( this.opt.debug ) {
                    console.trace( info );
                }
            };
            
            /**
             * 获取队列第一个文件
             *
             * @returns {*}
             */
            this.getFirstFile = function () {
                for ( var j in this.imageFile ) {
                    if ( this.imageFile[ j ] )return this.imageFile[ j ];
                }
            };
            
            /**
             * 通过文件对象id，重新上传文件
             * @param file_id
             */
            this.reUpload = function ( file_id ) {
                if ( this.imageFile[ file_id ] ) {
                    this._uploadFile( this.imageFile[ file_id ] );
                } else {
                    _t.throwError( _t.error_code.file_is_empty );
                }
            };
            /**
             * 文件上传处理
             * @param file
             * @private
             */
            this._uploadFile = function ( _uploadFile ) {
                var _this = this;
                this.loadingNumber++;
                if ( this.loadedList[ _uploadFile.id ] ) {
                    _t.log( '已上传过的：id=' + _uploadFile.id );
                    if ( this.loadingNumber <= 1 ) this.loadingNumber--;
                    
                    _t._uploadNext();
                }
                this.loadedList[ _uploadFile.id ] = true;
                if ( _t.opt.debug ) {
                    //_t.log( '>> upload file id :' + _uploadFile.id );
                    _t.log( this.loadedList );
                }
                
                if ( !_uploadFile ) {
                    _t.throwError( _t.error_code.file_is_empty );
                    return false;
                }
                
                if ( !_t.opt.uploadUrl || _t.opt.uploadUrl == '' ) {
                    _t.throwError( _t.error_code.notServerUrl );
                    return false
                }
                if ( _t.opt.onUploadBefore && this.isFunction( _t.opt.onUploadBefore ) ) {
                    //返回false 就不上传
                    if ( _t.opt.onUploadBefore( _uploadFile ) === false ) {
                        return false;
                    }
                }
                this.formData = new FormData();
                if(_t.opt.uploadContentType=='base64'){
                    this.formData.append( _t.opt.imageFileField , _uploadFile.base64 );
                }else {
                    this.formData.append( _t.opt.imageFileField , _uploadFile );
                }
                for ( var k in _t.opt.params ) {
                    this.formData.append( k , _t.opt.params[ k ] );//添加自定义想着参数
                }
                /**
                 * 进度条事件
                 * @param xhl
                 */
                var progress = function ( xhl ) {
                    if ( _t.isFunction( _t.opt.onProgress ) ) {
                        try {
                            _t.loadStatus = 'loading';
                            var P         = {};
                            P.loaded      = xhl.loaded;
                            P.totalSize   = xhl.total || xhl.totalSize;
                            P.file        = _uploadFile;
                            P.progress    = Math.ceil( P.loaded / P.totalSize * 100 );
                            if ( _t.opt.debug ) {
                                //console.log('-> 进度 id:' + P.file.id + '  , ' + P.progress + '% ');
                            }
                            _t.opt.onProgress( P , xhl );
                        } catch ( e ) {
                            _t.throwError( null , e.message );
                        }
                    }
                };
                
                var obj = $( "div" );
                if ( typeof Zepto == 'undefined' ) {
                    var ajaxOpt = {
                        url        : _t.opt.uploadUrl ,
                        data       : _this.formData ,
                        processData: false ,
                        contentType: false ,
                        type       : 'post' ,
                        beforeSend : function ( e ) {
                            if ( _t.isFunction( _t.opt.onStartSend ) ) _t.opt.onStartSend( this );
                        } ,
                        xhr        : function () {
                            var xhr = $.ajaxSettings.xhr();
                            //绑定上传进度的回调函数
                            xhr.withCredentials = true;
                            xhr.upload.addEventListener( 'progress' , progress , false );
                            return xhr;//一定要返回，不然jQ没有XHR对象用了
                        } ,
                        complete   : function () {
                            if ( _t.isFunction( _t.opt.onUploadComplete ) ) _t.opt.onUploadComplete( _uploadFile );
                        }
                    };
                    if ( _t.opt.xhrFields ) {
                        ajaxOpt.xhrFields = _t.opt.xhrFields;
                    }
                    $.ajax( ajaxOpt ).done( function ( response ) {
                        try {
                            response = $.parseJSON( response );
                        } catch ( e ) {
                            if ( _t.isFunction( _t.opt.uploadError ) ) {
                                _t.opt.uploadError( _uploadFile , e.message );
                            }
                        } finally {
                            if ( _t.isFunction( _t.opt.uploadSuccess ) ) {
                                if ( _t.opt.uploadSuccess( _uploadFile , response ) === false ) {
                                    //上传失败
                                    _t.opt.uploadError( _uploadFile );
                                    _t.upload_fail_number++;
                                } else {
                                    //上传成功
                                    _t.removeFileFromQueue( _uploadFile.id );
                                    _t.upload_success_number++;
                                }
                            }
                        }
                    } ).fail( function ( e , error_type , error_msg ) {
                        
                        switch ( e.status ) {
                            case 413:
                                _t.throwError( _t.error_code.Request_Entity_Too_Large );
                                break;
                            case 404:
                                _t.throwError( _t.Request_not_find );
                                break;
                        }
                        if ( _t.isFunction( _t.opt.uploadError ) ) {
                            if ( _t.opt.uploadError( _uploadFile , error_msg ) === true ) {
                                //返回true ，把上传失败的队列文件删除
                                _t.removeFileFromQueue( _uploadFile.id );
                            }
                        }
                        _t.upload_fail_number++;
                        _t.debugInfo();
                    } ).always( function () {
                        _t.loadingNumber--;
                        if ( _t.getQueueCount() > 0 ) {
                            _t._uploadNext();//上传一下文件
                        }
                        if ( _t.getQueueCount() == 0 ) {
                            _t.allUploadComplete();//
                        }
                        _t.debugInfo();
                    } );
                } else {
                    //zepto ajax方法
                    var ajaxOpt = {
                        url        : _t.opt.uploadUrl ,
                        data       : _this.formData ,
                        processData: false ,
                        contentType: false ,
                        type       : 'post' ,
                        beforeSend : function ( e ) {
                            if ( _t.isFunction( _t.opt.onStartSend ) ) _t.opt.onStartSend( this );
                        } ,
                        xhr        : function () {
                            var xhr = $.ajaxSettings.xhr();
                            xhr.withCredentials = true;
                            //绑定上传进度的回调函数
                            xhr.upload.addEventListener( 'progress' , progress , false );
                            return xhr;//一定要返回，不然jQ没有XHR对象用了
                        } ,
                        complete   : function () {
                            _t.loadingNumber--;
                            if ( _t.isFunction( _t.opt.onUploadComplete ) ) _t.opt.onUploadComplete( _uploadFile );
                            if ( _t.getQueueCount() > 0 ) {
                                _t._uploadNext();//上传一下文件
                            }
                            if ( _t.getQueueCount() == 0 ) {
                                _t.allUploadComplete();//
                            }
                            _t.debugInfo();
                        } ,
                        success    : function ( response ) {
                            
                            try {
                                response = $.parseJSON( response );
                            } catch ( e ) {
                                if ( _t.isFunction( _t.opt.uploadError ) ) {
                                    _t.opt.uploadError( _uploadFile , e.message );
                                }
                            } finally {
                                if ( _t.isFunction( _t.opt.uploadSuccess ) ) {
                                    if ( _t.opt.uploadSuccess( _uploadFile , response ) === false ) {
                                        //上传失败
                                        _t.opt.uploadError( _uploadFile );
                                        _t.upload_fail_number++;
                                    } else {
                                        //上传成功
                                        _t.removeFileFromQueue( _uploadFile.id );
                                        _t.upload_success_number++;
                                    }
                                }
                            }
                        } ,
                        error      : function ( e ) {
                            switch ( e.status ) {
                                case 413:
                                    _t.throwError( _t.error_code.Request_Entity_Too_Large );
                                    break;
                                case 404:
                                    _t.throwError( _t.Request_not_find );
                                    break;
                            }
                            if ( _t.isFunction( _t.opt.uploadError ) ) {
                                if ( _t.opt.uploadError( _uploadFile , error_msg ) === true ) {
                                    //返回true ，把上传失败的队列文件删除
                                    _t.removeFileFromQueue( _uploadFile.id );
                                }
                            }
                            _t.upload_fail_number++;
                            _t.debugInfo();
                        }
                        
                    };
                    if ( _t.opt.xhrFields ) {
                        ajaxOpt.xhrFields = _t.opt.xhrFields;
                    }
                    
                    $.ajax( ajaxOpt );
                }
                
            };
            this.debugInfo = function () {
                if ( _t.opt.debug ) {
                    console.log( '队列长度:' + _t.getQueueCount() );
                    console.log( '正在上传数量:' + _t.loadingNumber );
                    console.log( 'success :' + _t.upload_success_number );
                    console.log( 'fail :' + _t.upload_fail_number );
                }
            };
            
            /**
             * 队列上传所有完成
             */
            this.allUploadComplete = function () {
                if ( _t.isFunction( _t.opt.onAllUploadComplete ) ) _t.opt.onAllUploadComplete();
            };
            
            /**
             * 停止队列上传，如有正在上传中的文件不受影响
             */
            this.stopUpload = function () {
                this.stopUploadToken = true;
            };
            
            /**
             * 清空文件队列
             *
             */
            this.cleanQueue = function () {
                this.imageFile = [];
            };
            /**
             * 从文件队列中删除一个文件
             * @param file_id 文件索引id
             */
            this.removeFileFromQueue = function ( file_id ) {
                try {
                    delete _t.imageFile[ file_id ];
                    if ( _t.opt.debug ) {
                        console.log( '移出队列：' + file_id );
                        console.log( '队列长度：' + _t.getQueueCount() );
                        console.log( _t.imageFile );
                        
                    }
                } catch ( e ) {
                    _t.throwError( null , e.message );
                }
            };
            /**
             * 获取队列长度
             * @returns {number}
             */
            this.getQueueCount = function () {
                var count = 0;
                for ( var i in this.imageFile ) {
                    if ( this.imageFile[ i ] ) count++;
                }
                return count;
            };
            /**
             * 初始化选项参数
             * @param opt
             */
            this.initOptions = function ( opt ) {
                opt                   = opt || {};
                opt.accept            = opt.accept || 'image/*';
                opt.onUpload          = opt.onUpload || false;
                opt.selectImageBtn    = opt.selectImageBtn || '.selectImg';
                opt.maxLength         = opt.maxLength || 50;
                opt.debug             = opt.debug || false;
                opt.params            = opt.params || {};
                opt.autoUpload        = opt.autoUpload || false;
                opt.multiple          = opt.multiple || false;
                opt.uploadUrl         = opt.uploadUrl || false;
                opt.uploadSuccess     = opt.uploadSuccess || false;
                opt.imageFileField    = opt.imageFileField || 'file';
                opt.accept_type       = opt.accept_type || '';
                opt.fileMaxSize       = opt.fileMaxSize ? parseInt( opt.fileMaxSize ) : 0;
                opt.uploadingSize     = opt.uploadingSize || 3;
                opt.uploadContentType = opt.uploadContentType || 'file';
                
                this.opt = opt;
                
                _t.error_code                                          = {};
                _t.error_msg                                           = [];
                _t.error_code.system_exception                         = -1;
                // _t.error_msg[_t.error_code.system_exception]       = '异常';
                _t.error_code.maxLength                                = 100;
                _t.error_msg[ _t.error_code.maxLength ]                = '超过最大文件数量的限制';
                _t.error_code.notFile                                  = 101;
                _t.error_msg[ _t.error_code.notFile ]                  = '没有要上传的文件';
                _t.error_code.notServerUrl                             = 102;
                _t.error_msg[ _t.error_code.notServerUrl ]             = '无效的上传服务器URL';
                _t.error_code.not_allow_type                           = 103;
                _t.error_msg[ _t.error_code.not_allow_type ]           = '无效文件类型';
                _t.error_code.file_size_error                          = 104;
                _t.error_msg[ _t.error_code.file_size_error ]          = '文件大小异常';
                _t.error_code.file_size_error_big                      = 105;
                _t.error_msg[ _t.error_code.file_size_error_big ]      = '文件大小不得超过' + _t.opt.fileMaxSize + 'KB';
                _t.error_code.fileMaxSizeParam_invalid                 = 106;
                _t.error_msg[ _t.error_code.fileMaxSizeParam_invalid ] = '参数fileMaxSize不正确';
                _t.error_code.not_file_in_queue                        = 107;
                _t.error_msg[ _t.error_code.not_file_in_queue ]        = '队列中不存在文件对象';
                _t.error_code.file_is_empty                            = 108;
                _t.error_msg[ _t.error_code.file_is_empty ]            = '上传对象无效';
                
                _t.error_code.Request_Entity_Too_Large                 = 413;
                _t.error_msg[ _t.error_code.Request_Entity_Too_Large ] = '上传的文件太在，被服务器拒绝';
                _t.error_code.Request_not_find                         = 404;
                _t.error_msg[ _t.error_code.Request_not_find ]         = '404错误，请求资源不存在';
                
            };
            
            this.isFunction = function ( funcObj ) {
                return (
                    typeof funcObj == 'function'
                );
            };
            /**
             * 获取所有文件队列
             * @returns {Array}
             */
            this.getAllFiles = function () {
                return this.imageFile;
            };
            /**
             * 通过ID获取队列中的文件
             * @param file_id
             * @returns {*}
             */
            this.getFile = function ( file_id ) {
                return this.imageFile[ file_id ];
            }
        };
        
        return ptH5upload;
        
    } )
);