const TILE_SCALE_MULTIPLIER = 0.064941;
const TILE_SCALE_ASPECT_FIX_MULTIPLIER = 1.150055;

const HEXAGON_BIG_DIAMETER = 86;
const HEXAGON_SMALL_DIAMETER = Math.sqrt(3)*HEXAGON_BIG_DIAMETER/2;
const HEXAGONS_LAYOUT_GAP = 2;

const HEXAGON_IN_TILE_OFFSET = {x: 21, y: 0};

const HEX_ANGLES = [0, Math.PI/3, 2*Math.PI/3, Math.PI, -2*Math.PI/3, -Math.PI/3];


var onWindowResize = function() {
    renderer.resize(window.innerWidth, window.innerHeight);
    tilingSprite.width = window.innerWidth;
    tilingSprite.height = window.innerHeight;
    stage.hitArea = new PIXI.Rectangle(0, 0, window.innerWidth, window.innerHeight);
};

var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
var stage = new PIXI.Container();
document.body.appendChild(renderer.view);
window.addEventListener("resize", onWindowResize);

var zoomScale = 1;

// create a texture from an image path
var texture = PIXI.Texture.fromImage('assets/hex.png');
var addButtonTexture = PIXI.Texture.fromImage('assets/skins/add_button.png');
var closeButtonTexture = PIXI.Texture.fromImage('assets/skins/close_button.png');
var contentTextures = [];
for (var i=1;i<4;i++) {
    contentTextures.push(PIXI.Texture.fromImage('assets/content/0' + i + '.png'));
}

/* create a tiling sprite ...
 * requires a texture, a width and a height
 * in WebGL the image size should preferably be a power of two
 */
var tilingSprite = new PIXI.extras.TilingSprite(
    texture,
    window.innerWidth,
    window.innerHeight
);
tilingSprite.tileScale.x = zoomScale*TILE_SCALE_MULTIPLIER;
tilingSprite.tileScale.y = zoomScale*TILE_SCALE_MULTIPLIER*TILE_SCALE_ASPECT_FIX_MULTIPLIER;
stage.addChild(tilingSprite);

render();

var marker = new PIXI.Container();
var content = [];

function render() {
    // render the root container
    renderer.render(stage);
    requestAnimationFrame(render);
}

addDragNDrop();
addElementsLogic();
function addDragNDrop() {
    stage.interactive = true;

    var isDragging = false,
        prevX, prevY, downX, downY;

    stage.mousedown = function (moveData) {
        var pos = moveData.data.global;
        downX = pos.x; downY = pos.y;
        prevX = pos.x; prevY = pos.y;
        isDragging = true;
    };

    stage.mousemove = function (moveData) {
        if (!isDragging) {
            return;
        }
        var pos = moveData.data.global;
        var dx = pos.x - prevX;
        var dy = pos.y - prevY;

        tilingSprite.tilePosition.x += dx;
        tilingSprite.tilePosition.y += dy;
        for (var i=0;i<content.length;i++) {
            content[i].position.x += dx;
            content[i].position.y += dy;
        }
        marker.position.x += dx;
        marker.position.y += dy;
        prevX = pos.x; prevY = pos.y;
    };

    stage.mouseup = stage.mouseupoutside = function (moveData) {
        isDragging = false;
        var pos = moveData.data.global;
        var dx = pos.x - downX;
        var dy = pos.y - downY;
        if (stage.mouseclick && dx*dx+dy*dy < 10) {
            stage.mouseclick(moveData);
        }
    };

    var body = document.body;
    var zoomScaleMax = 10;
    var zoomScaleMin = 0.25;
    if (body.addEventListener){
        body.addEventListener( 'mousewheel', zoom, false );     // Chrome/Safari/Opera
        body.addEventListener( 'DOMMouseScroll', zoom, false ); // Firefox
    }else if (body.attachEvent){
        body.attachEvent('onmousewheel',zoom);                  // IE
    }

    function wheelDirection(evt){
        if (!evt) evt = event;
        return (evt.detail<0) ? 1 : (evt.wheelDelta>0) ? 0.25 : -0.25;
    }

    function zoom(evt){
        // Find the direction that was scrolled
        var direction = wheelDirection(evt);
        // Set the old scale to be referenced later
        var oldScale = tilingSprite.tileScale.x/TILE_SCALE_MULTIPLIER;
        // Manipulate the scale based on direction
        zoomScale = oldScale + direction;
        //Check to see that the scale is not outside of the specified bounds
        if (zoomScale > zoomScaleMax) zoomScale = zoomScaleMax;
        else if (zoomScale < zoomScaleMin) zoomScale = zoomScaleMin;
        //Set the position and scale
        var mouseX = evt.clientX;
        var mouseY = evt.clientY;
        tilingSprite.tilePosition.x = (tilingSprite.tilePosition.x - mouseX) * (zoomScale / oldScale) + mouseX;
        tilingSprite.tilePosition.y = (tilingSprite.tilePosition.y - mouseY) * (zoomScale / oldScale) + mouseY;
        tilingSprite.tileScale.x = zoomScale*TILE_SCALE_MULTIPLIER;
        tilingSprite.tileScale.y = zoomScale*TILE_SCALE_MULTIPLIER*TILE_SCALE_ASPECT_FIX_MULTIPLIER;
        for (var i=0;i<content.length;i++) {
            content[i].position.x = (content[i].position.x - mouseX) * (zoomScale / oldScale) + mouseX;
            content[i].position.y = (content[i].position.y - mouseY) * (zoomScale / oldScale) + mouseY;
            content[i].scale.x = zoomScale;
            content[i].scale.y = zoomScale;
        }
        marker.position.x = (marker.position.x - mouseX) * (zoomScale / oldScale) + mouseX;
        marker.position.y = (marker.position.y - mouseY) * (zoomScale / oldScale) + mouseY;
        marker.scale.x = zoomScale;
        marker.scale.y = zoomScale;
    }
}

function addElementsLogic() {
    stage.mouseclick = function (moveData) {
        var pos = moveData.data.global;
        var neededCellPosition = {x: 0, y: 0};
        neededCellPosition.x = Math.round(((pos.x-tilingSprite.tilePosition.x)/(zoomScale*(HEXAGON_BIG_DIAMETER+2.7)))*(4/3));
        /*neededCellPosition.x = Math.round((pos.x - tilingSprite.tilePosition.x)/(zoomScale*(Math.sqrt(Math.pow(HEXAGON_SMALL_DIAMETER,2)-Math.pow(HEXAGON_SMALL_DIAMETER/2,2)) + 2)));*/
        neededCellPosition.y = Math.round(((pos.y-tilingSprite.tilePosition.y)/(zoomScale*(HEXAGON_SMALL_DIAMETER+HEXAGONS_LAYOUT_GAP))) + 0.5 * (neededCellPosition.x % 2));
        //TODO: get rid of this, rewrite algorithm

        /*if((Math.floor(neededCellPosition.x + 0.333333) == Math.floor(neededCellPosition.x)) || (Math.abs((getDecimal(neededCellPosition.x) - 2/3) * 1.5) + Math.abs(getDecimal(neededCellPosition.y) - 0.5 * Math.abs(Math.floor(neededCellPosition.x)%2))) > 1/2) {
            console.log(neededCellPosition.x, neededCellPosition.y, 'upper');
            neededCellPosition.x = Math.floor(neededCellPosition.x);
        }
        else {
            console.log(neededCellPosition.x, neededCellPosition.y, 'lower');
            neededCellPosition.x = Math.ceil(neededCellPosition.x);
            //neededCellPosition.y = Math.floor(neededCellPosition.y);
        }
        if (neededCellPosition.x % 2 == 0) {
            neededCellPosition.y = Math.round(neededCellPosition.y);
        }
        else neededCellPosition.y = Math.round(neededCellPosition.y)*/
        //neededCellPosition.x = Math.round((pos.x - tilingSprite.tilePosition.x)/(zoomScale*(Math.sqrt(Math.pow(HEXAGON_SMALL_DIAMETER,2)-Math.pow(HEXAGON_SMALL_DIAMETER/2,2)) + 2)));

        //addMarker(neededCellPosition.x, neededCellPosition.y);
        //for (var i = 0; i < 1000; i++) {
            addMarker(neededCellPosition.x, neededCellPosition.y);
       // }
    };
    function addMarker(i, j) {
        //calculate native coords
        var x = i * (Math.sqrt(Math.pow(HEXAGON_SMALL_DIAMETER,2)-Math.pow(HEXAGON_SMALL_DIAMETER/2,2)) + HEXAGONS_LAYOUT_GAP);
        var y = (Math.abs(i % 2) == 1) ? (j-0.5) * (HEXAGON_SMALL_DIAMETER+HEXAGONS_LAYOUT_GAP) : j * (HEXAGON_SMALL_DIAMETER+HEXAGONS_LAYOUT_GAP);
        //adjust position to background texture
        x += HEXAGON_IN_TILE_OFFSET.x;
        y += HEXAGON_IN_TILE_OFFSET.y;
        //calculate real screen coords
        x = x*zoomScale + tilingSprite.tilePosition.x;
        y = y*zoomScale + tilingSprite.tilePosition.y;
        var hexSprite = createHexagon(HEXAGON_BIG_DIAMETER/2, 0xaa3333);
        hexSprite.position.x = x;
        hexSprite.position.y = y;
        hexSprite.scale.x = zoomScale;
        hexSprite.scale.y = zoomScale;
        stage.addChild(hexSprite);
        stage.removeChild(marker);
        marker = hexSprite;
    }

    function createHexagon(bigRadius, color) {
        var hexagon = new PIXI.Container();

        var addButton = new PIXI.Sprite(addButtonTexture);
        addButton.scale.x = addButton.scale.y = bigRadius/(addButton.width);
        addButton.x = -addButton.width/2;
        addButton.y = -addButton.height/2;
        addButton.interactive = true;
        addButton.on('pointerdown', onHexagonClick);

        hexagon.addChild(addButton);

        // var selectImageBackground = createSlicedHexagon(bigRadius, 0xffffff);
        // var selectImageLabel = new PIXI.Text('Choose content', { font: '35px Snippet', fill: 'white'});
        // selectImageLabel.scale.x = selectImageLabel.scale.y = bigRadius*0.6/(selectImageLabel.width);
        // selectImageLabel.x = -selectImageLabel.width/2;
        // selectImageLabel.y = -selectImageLabel.height/2 - 0.3*HEXAGON_SMALL_DIAMETER;
        // hexagon.addChild(selectImageBackground);
        // hexagon.addChild(selectImageLabel);
        // for (var i=0; i<contentTextures.length; i++) {
        //     var image = new PIXI.Sprite(contentTextures[i]);
        //     image.scale.x = image.scale.y = bigRadius*0.45/image.width;
        //     image.x = -image.width/2 + (i - 1)*(bigRadius*0.5);
        //     image.y = -image.height/2;
        //     hexagon.addChild(image);
        // }

        // var g = new PIXI.Graphics();
        // g.lineStyle(1.5, 0x000000, 1);
        // g.beginFill(0xffffff);
        // var polygonArgs = [];
        // for (var i=0; i<HEX_ANGLES.length; i++) {
        //     polygonArgs.push(bigRadius*Math.cos(HEX_ANGLES[i]));
        //     polygonArgs.push(bigRadius*Math.sin(HEX_ANGLES[i]));
        // }
        // polygonArgs.push(bigRadius*Math.cos(HEX_ANGLES[0]));
        // polygonArgs.push(bigRadius*Math.sin(HEX_ANGLES[0]));
        // g.drawPolygon(polygonArgs);
        // g.endFill();
        // hexagon.addChild(g);

        return hexagon;
    }

    function createSlicedHexagon(bigRadius, color) {
        var g = new PIXI.Graphics();
        g.beginFill(color);
        var polygonArgs = [];
        for (var i=0; i<HEX_ANGLES.length; i++) {
            polygonArgs.push(bigRadius*Math.cos(HEX_ANGLES[i]));
            polygonArgs.push(bigRadius*Math.sin(HEX_ANGLES[i]));
        }
        polygonArgs.push(bigRadius*Math.cos(HEX_ANGLES[0]));
        polygonArgs.push(bigRadius*Math.sin(HEX_ANGLES[0]));
        //slice top and bottom of hex
        polygonArgs[2] = (polygonArgs[0] + polygonArgs[2])/2;
        polygonArgs[3] = (polygonArgs[1] + polygonArgs[3])/2;
        polygonArgs[4] = (polygonArgs[6] + polygonArgs[4])/2;
        polygonArgs[5] = (polygonArgs[7] + polygonArgs[5])/2;
        polygonArgs[8] = (polygonArgs[6] + polygonArgs[8])/2;
        polygonArgs[9] = (polygonArgs[7] + polygonArgs[9])/2;
        polygonArgs[10] = (polygonArgs[0] + polygonArgs[10])/2;
        polygonArgs[11] = (polygonArgs[1] + polygonArgs[11])/2;
        g.drawPolygon(polygonArgs);
        g.endFill();
        return g;
    }

    function onHexagonClick() {
        console.log('Add button clicked!');
        //TODO get selected hexagon and switch it to "select image" state
    }
    function getDecimal(num) {
        return num - Math.floor(num);
    }

}