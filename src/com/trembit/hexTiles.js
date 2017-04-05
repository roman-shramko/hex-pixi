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
stage.addChild(tilingSprite);

render();

function render() {
    // render the root container
    renderer.render(stage);
    requestAnimationFrame(render);
}

addDragNDrop();
function addDragNDrop() {
    stage.interactive = true;

    var isDragging = false,
        prevX, prevY;

    stage.mousedown = function (moveData) {
        var pos = moveData.data.global;
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
        prevX = pos.x; prevY = pos.y;
    };

    stage.mouseup = function (moveDate) {
        isDragging = false;
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
        var oldScale = tilingSprite.tileScale.x;
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
        tilingSprite.tileScale.x = zoomScale;
        tilingSprite.tileScale.y = zoomScale;
    }
}