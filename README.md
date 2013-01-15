node-spritesheet
================

A fast node spritesheet generator


Use:


    var RectangleSheet = require('./rectangle_sheet.js');

    var sheet = new RectangleSheet({
        source_dir: images_dir,
        rel_sprite_path: "", // in case your css file and sprite image are in different directories
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