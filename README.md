spritesheetjs
================

A fast node spritesheet generator

Install:

    npm install spritesheetjs
Use:


    var RectangleSheet = require('spritesheetjs');

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