var RectangleSheet = require('./rectangle_sheet.js');


    var images_dir = "72dpi";

    var sheet = new RectangleSheet({
        source_dir: images_dir,
        rel_sprite_path: "",
        sprite_path: 'out/sprite.png',
        css_path: 'out/sprite.css'
    });

    sheet.spritesheet(function(css){
        // css is an array of elements
        // {
        //  name: image/element name
        //  width,
        //  height,
        //  x,
        //  y
        // }
    });
