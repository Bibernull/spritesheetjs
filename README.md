spritesheetjs
================


## Command line example 

```shell
npm install spritesheetjs -g
```

```shell
    $ spritesheetjs --help

    Usage: spritesheetjs [options]

    Options:

    -h, --help                     output usage information
    -V, --version                  output the version number
    -d, --source_dir [value]       Image source directory
    -r, --rel_sprite_path [value]  relative sprite path
    -p, --sprite_path [value]      Output sprite path
    -c, --css_path [value]         output css path
```

example
```shell
    $ spritesheetjs -d images
    $ Number of images 6
    $ Saved sprite.css
    $ Saved sprite.png
```

## Node.js example

Install:

```shell
npm install spritesheetjs
```
Use:

```js
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
```

