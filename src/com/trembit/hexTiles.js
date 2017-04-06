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
}

var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
var stage = new PIXI.Container();
document.body.appendChild(renderer.view);
window.addEventListener("resize", onWindowResize);

var zoomScale = 1;

// create a texture from an image path
var texture = PIXI.Texture.fromImage('hex.png');

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

var markers = [];

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
        for (var i=0;i<markers.length;i++) {
            markers[i].position.x += dx;
            markers[i].position.y += dy;
        }
        prevX = pos.x; prevY = pos.y;
    };

    stage.mouseup = function (moveData) {
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
    };

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
        for (var i=0;i<markers.length;i++) {
            markers[i].position.x = (markers[i].position.x - mouseX) * (zoomScale / oldScale) + mouseX;
            markers[i].position.y = (markers[i].position.y - mouseY) * (zoomScale / oldScale) + mouseY;
            markers[i].scale.x = zoomScale;
            markers[i].scale.y = zoomScale;
        }
    }
}

function addElementsLogic() {
    stage.mouseclick = function (moveData) {
        for (var i = 0;i< 50; i++) {
            for (var j = 0;j< 50; j++) {
                addMarker(i, j);
            }
        }
    };

    function addMarker(i, j) {
        //calculate native coords
        var x = i * (Math.sqrt(Math.pow(HEXAGON_SMALL_DIAMETER,2)-Math.pow(HEXAGON_SMALL_DIAMETER/2,2)) + HEXAGONS_LAYOUT_GAP);
        var y = (i % 2 == 1) ? (j-0.5) * (HEXAGON_SMALL_DIAMETER+HEXAGONS_LAYOUT_GAP) : j * (HEXAGON_SMALL_DIAMETER+HEXAGONS_LAYOUT_GAP);
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
        markers.push(hexSprite);
    }

    function createHexagon(bigRadius, color) {
        var g = new PIXI.Graphics();
        g.beginFill(color);
        var polygonArgs = [];
        for (var i=0; i<HEX_ANGLES.length; i++) {
            polygonArgs.push(bigRadius*Math.cos(HEX_ANGLES[i]));
            polygonArgs.push(bigRadius*Math.sin(HEX_ANGLES[i]));
        }
        polygonArgs.push(bigRadius*Math.cos(HEX_ANGLES[0]));
        polygonArgs.push(bigRadius*Math.sin(HEX_ANGLES[0]));
        g.drawPolygon(polygonArgs);
        g.endFill();
        return g;
    }

}