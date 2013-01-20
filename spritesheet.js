               
var pngjs = require('pngjs');
var PNG = require('png-js');
var _ = require('underscore');
var async = require('async');
var fs = require('fs');
var mkdirp = require('mkdirp');
var RectangleSheet = require('./rectangle_sheet.js');

function baseName(str) {
   var base = new String(str).substring(str.lastIndexOf('/') + 1);
   return base;
}

        var spritesheetjs =  function(options) {
                if(options.images && options.source_dir){
                    throw "Pass the source dir OR the image paths array, not both.";
                }

                if(!options.selector){
                    options.selector = "";
                }

                this.selector = options.selector;
                this.source_dir = options.source_dir;
                this.images = options.images;
                this.sprite_path = options.sprite_path;
                this.rel_sprite_path = options.rel_sprite_path;
                this.css_path = options.css_path;
                this.sprite_name = baseName(options.sprite_path);

                this.readImagesMetadata();
            };

            spritesheetjs.prototype.readImagesMetadata = function() {

                var files = "";
                var self = this;
                if(this.images){
                    files = this.images;
                }else{
                    files = fs.readdirSync(this.source_dir);
                }

                var images = [];
                files = _.filter(files, function(file){
                    return file.substr(-4) == '.png';
                });

                console.log("Number of images " + files.length);

                _.each(files, function(v, i){
                    var dir = (self.source_dir) ? self.source_dir + "/" : "";

                    var image = PNG.load(dir + v);


                    images.push({image:v, width: image.width, height: image.height});

                });

                images.sort(function(a, b){
                    return b.height - a.height;
                });

                //console.log(images);
                var totalWidth = 0;
                var maxHeight = parseInt(images[0].height + images[0].height/2);

                _.each(images, function(v, i){
                    totalWidth += v.width;
                });

                this.sheet =  new RectangleSheet({width:totalWidth, height: maxHeight});
                
                this.images = images;

            };

            spritesheetjs.prototype.spritesheet = function(callback) {
                var self = this;
                this.sheet.pack(this.images, function(res){
                    
                    self.push_images(res);

                    self.css(self.rel_sprite_path, self.sprite_name, res, function(css){
                        var css_str = [];
                         _.each(css, function(v, i){

                            css_str.push(self.selector + '.' + v.name + ' { \n');
                            css_str.push('\twidth: ' + v.width + 'px;\n');
                            css_str.push('\theight: ' + v.height + 'px;\n');
                            css_str.push('\tbackground-image: url(' + self.rel_sprite_path + self.sprite_name + ');\n');
                            css_str.push('\tbackground-position: -' + v.x + 'px -' + v.y + 'px;\n');
                            css_str.push('}\n');
                        });


                        var out_dir = self.sprite_path.substr(0, self.sprite_path.lastIndexOf('/'));
                        
                        if(!fs.existsSync(out_dir)){
                            mkdirp.sync(out_dir);
                        }

                        fs.writeFile(self.css_path, css_str.join(''), function (err) {
                            if (err) throw err;
                            console.log("Saved " + self.css_path);



                            if(callback) {
                                callback(css);
                            }
                        });

                    });
                });

            };

            spritesheetjs.prototype.push = function(png, image, callback){
                fs.createReadStream(image.image)
                    .pipe(new pngjs.PNG({
                        filterType: 4
                    }))
                    .on('parsed', function() {
                        var x = image.x;
                        var y = image.y;
                        var w = image.width;
                        var h = image.height;

                        var start = (y*png.width*4) + x*4;
                        var k = 0;
                        
                        for (i = 0; i < h; i++) {
                            k = (start + i*png.width*4);
                            for ( j = 0; j < w; j++) {
                                var idx = (i * w + j) << 2;

                                png.data[k] = this.data[idx];
                                k++;
                                png.data[k] = this.data[idx + 1];
                                k++;
                                png.data[k] = this.data[idx + 2];
                                k++;
                                png.data[k] = this.data[idx + 3];
                                k++;

                            }
                        }
                    callback(null, true);
                });
            };

            spritesheetjs.prototype.push_images = function(images) {
                
                var png = new pngjs.PNG({
                    width:this.sheet.width,
                    height:this.sheet.height
                });

                var fns = [];
                var self = this;

                var Push 

                _.each(images, function(v, i){
                     if(self.source_dir){
                            v.image = self.source_dir + '/' + v.image;
                    }
                    fns.push(function(callback){ self.push(png, v, function(err, res){ callback() })});
                });

                async.series(fns, function(err, res){
                    png.pack().pipe(fs.createWriteStream(self.sprite_path));
                    console.log("Saved " + self.sprite_path);
                });

            };

            spritesheetjs.prototype.css = function(rel_sprite_path, sprite_name, images, callback){

                var res = [];


                if(rel_sprite_path === 0){
                    rel_sprite_path = '';
                }

                _.each(images, function(v, i){
                    var obj = {
                        name: baseName(v.image.slice(0, -4)),
                        width: v.width,
                        height: v.height,
                        sprite_name: sprite_name,
                        x: v.x,
                        y: v.y
                    }

                    res.push(obj);

                    /*res.push('.' + v.image.slice(0, -4) + ' { \n');
                    res.push('\twidth: ' + v.width + 'px;\n');
                    res.push('\theight: ' + v.height + 'px;\n');
                    res.push('\tbackground-image: url(' + rel_sprite_path + sprite_name + ');\n');
                    res.push('\tbackground-position: ' + v.x + 'px ' + v.y + 'px;\n');
                    */


                });

                //res.push('}\n');

                callback(res);


            };
module.exports = spritesheetjs;