/******************************************************************************
 * 
 * 
 ******************************************************************************/
var fs              = require('fs')
,   gulp            = require('gulp')
,   async           = require('async')
,   transform       = require('vinyl-transform')
,   browserify      = require('browserify')
,   argv            = require('yargs').argv
,   uglify          = require('gulp-uglify')
,   rename          = require("gulp-rename")
,   AWS             = require('aws-sdk')
;



//http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Credentials_from_Disk
AWS.config.loadFromPath('./.awsrc');
AWS.config.update({region: 'eu-central-1'});



/******************************************************************************
* @name browserify
* @type task
* @description
*/
gulp.task('browserify', [], function(){
        var browserified = transform(function(filename){
                return browserify(filename).bundle();
            }
        );
      
      gulp.src("./index.js")
            .pipe(browserified)
            .pipe(rename("micromatch-browser.js"))
            .pipe(gulp.dest('./dist/'));
    }
);



/******************************************************************************
* @name distify
* @type task
* @description
* Conjunto de actividades destinadas a preparar los archivos para un entorno 
* de produccion; es decir, a crear las versiones `dist` de los archivos
*/
gulp.task('distify', [], function(){
        console.log("@@@ Running Distify task @@@");
        
        try {
            gulp.src("./dist/micromatch-browser.js")
                .pipe(uglify())
                .pipe(rename("micromatch-browser.min.js"))
                .pipe(gulp.dest("./dist"));
        } catch(err) {
            throw new Error("Error on @Vanilla JS");
        }
        
        console.log("@@@ Completed Distify task @@@");
    }
);



/******************************************************************************
* @name publish
* @type task
* @description
*/
gulp.task('publish', [], function(){
        console.log("@@@ Running Publish task @@@");
        
        //obtencion de la version de la release
        var VERSION;
        if (!argv.version) {
            VERSION = "latest";
            console.log("Using default version: %s", VERSION);
        } else if (argv.version === "semver") {
            VERSION = require("./package.json").version;
            console.log("Using package version: %s", VERSION);
        } else {
            VERSION = argv.version;
            console.log("Using specified version: %s", VERSION);
        }
        
        
        var SUB_TASKS = [uploadMinifiedVersion, uploadFullVersion];
        async.series(SUB_TASKS, function(e, r){
                if (e) {
                    console.log("@@@ Error on Publish task @@@");
                } else {
                    console.log("@@@ Completed Publish task @@@");
                }
            }
        );
        
        
        /////// VERSION ORIGINAL
        function uploadFullVersion(signal){
            //AWS configuration
            var s3 = new AWS.S3();
            var PARAMS = {
                Bucket: "prometeo",
                ACL: "public-read",
                Key: "lib/micromatch-browser/" + VERSION + "/micromatch-browser.js",
                Body: null,
            };
            
            //Read in the file, convert it to base64, store to S3
            fs.readFile("./dist/micromatch-browser.js", function (err, data) {
                    if (err) { signal(err, null) }
                    //creo un buffer
                    var B64_DATA = new Buffer(data, 'binary');
                    //configuro los params con el buffer
                    PARAMS.Body = B64_DATA;
                    //envio la peticion
                    s3.putObject(PARAMS, function(err, data) {
                            if (err) {
                                console.log(err, err.stack); 
                                signal(err, null);
                            } else {
                                console.log(data);
                                signal(null, true);
                            }
                        }
                    );
                }
            );
        
        }
        
        
        
        /////// VERSION MINIFICADA
        function uploadMinifiedVersion(signal){
            //AWS configuration
            var s3 = new AWS.S3();
            var PARAMS = {
                Bucket: "prometeo",
                ACL: "public-read",
                Key: "lib/micromatch-browser/" + VERSION + "/micromatch-browser.min.js",
                Body: null,
            };
            
            // Read in the file, convert it to base64, store to S3
            fs.readFile("./dist/micromatch-browser.min.js", function (err, data) {
                    if (err) { signal(err, null) }
                    //creo un buffer
                    var B64_DATA = new Buffer(data, 'binary');
                    //configuro los params con el buffer
                    PARAMS.Body = B64_DATA;
                    //envio la peticion
                    s3.putObject(PARAMS, function(err, data) {
                            if (err) {
                                console.log(err, err.stack);
                                signal(err, true);
                            } else {
                                console.log(data);
                                signal(null, true);
                            }
                        }
                    );
                }
            );
        }
    }
);