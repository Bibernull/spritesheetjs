
var requirejs = require('requirejs');
var pngjs = require('pngjs');
var PNG = require('png-js');
var _ = require('underscore');
var async = require('async');
var fs = require('fs');

var TwoDimensional = require('./two_dimensional');

function baseName(str) {
   var base = new String(str).substring(str.lastIndexOf('/') + 1); 
    /*if(base.lastIndexOf(".") != -1)       
       base = base.substring(0, base.lastIndexOf("."));*/
   return base;
}   

        var RectangleSheet =  function(options) {
                this.source_dir = options.source_dir;
                this.sprite_path = options.sprite_path;                
                this.rel_sprite_path = options.rel_sprite_path;
                this.css_path = options.css_path;
                this.sprite_name = baseName(options.sprite_path);
                this.readImagesMetadata(this.source_dir);
            };

            RectangleSheet.prototype.readImagesMetadata = function(source_dir) {

                var files = fs.readdirSync(source_dir);
                var images = [];
                files = _.filter(files, function(file){
                    return file.substr(-4) == '.png';
                });

                console.log("Number of images " + files.length);

                _.each(files, function(v, i){ 
                    
                    var image = PNG.load(source_dir + "/" + v);

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


                this.width = totalWidth;
                this.height = maxHeight;
                this.data = new TwoDimensional(this.width, this.height);
                this.data.setItem(0,0, false);

                this.images = images;

            };

            RectangleSheet.prototype.spritesheet = function(callback) {
                var self = this;
                this.pack(this.images, this.source_dir, function(sprite_path, res){
                    self.css(self.rel_sprite_path, self.sprite_name, res, function(css){
                        var css_str = [];
                         _.each(css, function(v, i){
                            
                            css_str.push('.' + v.name + ' { \n');
                            css_str.push('\twidth: ' + v.width + 'px;\n');
                            css_str.push('\theight: ' + v.height + 'px;\n');
                            css_str.push('\tbackground-image: url(' + self.rel_sprite_path + self.sprite_name + ');\n');
                            css_str.push('\tbackground-position: ' + v.x + 'px ' + v.y + 'px;\n');
                            
                        });
                        
                        css_str.push('}\n');

                        fs.writeFile(self.css_path, css_str.join(''), function (err) {
                            if (err) throw err;
                            console.log("Saved " + self.css_path);
                            callback(css);
                        });

                    });
                });

            };

            RectangleSheet.prototype.canAddRectangleAt = function(coordinates, newRectSize) {
                var requiredHorisontalCount = 0;
                var requiredVerticalCount = 0;
                var leftOverWidth = 0;
                var leftOverHeight = 0;

                var foundWidth = 0;
                var foundHeight = 0;
                var trialX = coordinates.x;
                var trialY = coordinates.y;

                // Check all cells that need to be unoccupied for there to be room for the rectangle.
                //console.log("Occupied " + this.data.item(trialX, trialY).occupied + " at " + trialX + " " + trialY);
                        
                while (foundHeight < newRectSize.height)
                {
                    trialX = coordinates.x;
                    foundWidth = 0;

                    while (foundWidth < newRectSize.width)
                    {
                        //console.log(this.data.columns);
                        //console.log(trialX);
                        if (this.data.item(trialX, trialY))
                        {
                            return false;
                        }

                        foundWidth += this.data.colWidth(trialX);
                        trialX++;
                    }

                    foundHeight += this.data.rowHeight(trialY);
                    trialY++;
                }

                // Visited all cells that we'll need to place the rectangle,
                // and none were occupied. So the space is available here.

                requiredHorisontalCount = trialX - coordinates.x;
                requiredVerticalCount = trialY - coordinates.y;

                leftOverWidth = (foundWidth - newRectSize.width);
                leftOverHeight = (foundHeight - newRectSize.height);

                return {requiredVerticalCount: requiredVerticalCount,
                        requiredHorisontalCount: requiredHorisontalCount,
                        leftOverWidth: leftOverWidth,
                        leftOverHeight: leftOverHeight
                        };
            };

            RectangleSheet.prototype.addRectangle = function(newRectSize) {
                rectangleXOffset = 0;
                rectangleYOffset = 0;
               

                var requiredHeight = newRectSize.height;
                var requiredWidth = newRectSize.width;

                var x = 0;
                var y = 0;
                var offsetX = 0;
                var offsetY = 0;
                
                var rowCount = this.data.rowCount;

                while(true){

                    var requiredHorisontalCount = 0;
                    var requiredVerticalCount = 0;
                    var leftOverWidth = 0;
                    var leftOverHeight = 0;

                    // First move upwards until we find an unoccupied cell. 
                    // If we're already at an unoccupied cell, no need to do anything.
                    // Important to clear all occupied cells to get 
                    // the lowest free height deficit. This must be taken from the top of the highest 
                    // occupied cell.

                    while ((y < rowCount) && (this.data.item(x, y)))
                    {
                        offsetY += this.data.rowHeight(y);
                        y += 1;
                    }

                    // If we found an unoccupied cell, than see if we can place a rectangle there.
                    // If not, than y popped out of the top of the canvas.

                    if ((y < rowCount) && (this.freeHeightDeficit(this.height, offsetY, requiredHeight) <= 0)) {
                        
                        var available = this.canAddRectangleAt({x:x, y:y}, {width: requiredWidth, height:requiredHeight});
                        //console.log(available);
                        if (available) {

                            this.placeRectangle(
                                {x:x, y:y}, {width: requiredWidth, height: requiredHeight},
                                available.requiredHorisontalCount, available.requiredVerticalCount,
                                available.leftOverWidth, available.leftOverHeight);

                            rectangleXOffset = offsetX;
                            rectangleYOffset = offsetY;

                            break;
                        }

                        // Go to the next cell
                        offsetY += this.data.rowHeight(y);
                        y += 1;
                    }

                    // If we've come so close to the top of the canvas that there is no space for the
                    // rectangle, go to the next column. This automatically also checks whether we've popped out of the top
                    // of the canvas (in that case, _canvasHeight == offsetY).

                    var freeHeightDeficit = this.freeHeightDeficit(this.height, offsetY, requiredHeight);
                    if (freeHeightDeficit > 0)
                    {
                        offsetY = 0;
                        y = 0;

                        offsetX += this.data.colWidth(x);

                        //console.log(newRectSize.height + " " + x + " " + this.data.colWidth(x))
                        x += 1;

                    }

                    // If we've come so close to the right edge of the canvas that there is no space for
                    // the rectangle, return false now.
                    if ((this.width - offsetX) < requiredWidth)
                    {
                        return false;
                    }
                }

                return {offsetX: offsetX,
                        offsetY: offsetY}
                

                
            };

            RectangleSheet.prototype.freeHeightDeficit = function(canvasHeight, offsetY, requiredHeight){
                var spaceLeftVertically = canvasHeight - offsetY;
                var freeHeightDeficit = requiredHeight - spaceLeftVertically;

                return freeHeightDeficit;
            };

            RectangleSheet.prototype.placeRectangle = function(coordinates, newRectSize, requiredHorisontalCount, requiredVerticalCount, leftOverWidth,leftOverHeight){
                if (leftOverWidth > 0) {
                  
                    var xFarRightColumn = coordinates.x + requiredHorisontalCount - 1;
                    this.data.insertColumn(xFarRightColumn, leftOverWidth);
                }

                if (leftOverHeight > 0) {
                 
                    var yFarBottomColumn = coordinates.y + requiredVerticalCount - 1;
                    this.data.insertRow(yFarBottomColumn, leftOverHeight);
                }

                for (i = coordinates.x + requiredHorisontalCount - 1; i >= coordinates.x; i--) {
                    for (j = coordinates.y + requiredVerticalCount - 1; j >= coordinates.y; j--) {
                        this.data.setItem(i, j, true);
                    }
                }

            };

            RectangleSheet.prototype.pack = function(images, source_path, cb){
                var success_count = 0;
                var self = this;

                var res_size = {width:0, height:0};

                var fns = [];

                var self = this;

                var png = new pngjs.PNG({
                    width:this.width,
                    height:this.height
                });

                var Push = function(image ,callback){
                    fs.createReadStream(source_path + '/' + image.image)
                        .pipe(new pngjs.PNG({
                            filterType: 4
                        }))
                        .on('parsed', function() {
                            var x = image.x;
                            var y = image.y;
                            var w = image.width;
                            var h = image.height;

                            var start = (y*self.width*4) + x*4;
                            var k = 0;

                            for (i = 0; i < h; i++) {
                                k = (start + i*self.width*4);
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

                }

                _.each(images, function(v, i){
                    var res = self.addRectangle(v);
                    if(res != false){
                        //console.log(res);
                        images[i].x = res.offsetX;
                        images[i].y = res.offsetY;

                        if(res_size.width < res.offsetX + v.width){
                            res_size.width = res.offsetX + v.width;
                        }

                        if(res_size.height < res.offsetY + v.height){
                            res_size.height = res.offsetY + v.height;
                        }

                        if((res.offsetX + v.width) > (res.offsetY + v.height)){
                            this.height += images[0].height/2;
                        }

                        success_count++;
                    }    

                    fns.push(function(callback){ Push(v, function(err, res){ callback()})});         
                });

                this.width -= this.data.colWidth(this.data.colCount - 1);
                png.width -= this.data.colWidth(this.data.colCount - 1); 

                var sprite_path = this.sprite_path;
                async.series(fns, function(err, res){
                    png.pack().pipe(fs.createWriteStream(sprite_path));
                    console.log("Saved " + sprite_path);
                });

                cb(this.sprite_path, images);
            };

            RectangleSheet.prototype.css = function(rel_sprite_path, sprite_name, images, callback){

                var res = [];
                

                if(rel_sprite_path === 0){
                    rel_sprite_path = '';
                }

                _.each(images, function(v, i){
                    var obj = {
                        name: v.image.slice(0, -4),
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

module.exports = RectangleSheet;
        /*** End RectangleSheet ***/