var _ = require('underscore');
var TwoDimensional = require('./two_dimensional');

        var RectangleSheet =  function(options) {
                this.width = options.width;
                this.height = options.height;
                this.data = new TwoDimensional(this.width, this.height);
                this.data.setItem(0,0, false);
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

            RectangleSheet.prototype.pack = function(images, cb){
                var success_count = 0;

                var res_size = {width:0, height:0};

                var fns = [];

                var self = this;

               

                _.each(images, function(v, i){
                    var res = self.addRectangle(v);
                    if(res != false){
                        //console.log(res);
                        images[i].x = res.offsetX;
                        images[i].y = res.offsetY;

                        /*if(res_size.width < res.offsetX + v.width){
                            res_size.width = res.offsetX + v.width;
                        }

                        if(res_size.height < res.offsetY + v.height){
                            res_size.height = res.offsetY + v.height;
                        }

                        if((res.offsetX + v.width) > (res.offsetY + v.height)){
                            this.height += images[0].height/2;
                        }*/

                        success_count++;                        
                    }

                });

                var last_col_occupied = false;
                for(y = 0; y < this.data.rowCount; y++){
                    if(this.data.item(this.data.colCount - 1, y)){
                        last_col_occupied = true;
                    }
                }

                if(!last_col_occupied){
                    this.width -= this.data.colWidth(this.data.colCount - 1);                    
                }

                cb(images);
            };

module.exports = RectangleSheet;
        /*** End RectangleSheet ***/