const $ = require("jquery");
const PIXI = require("pixi.js");

$(window).on("load", () => {
    
    let app = new PIXI.Application({ width: window.innerWidth, height: window.innerHeight });
    document.body.append(app.view);

    app.view.style.position = "fixed";
    app.view.style.top = "0px";
    app.view.style.left = "0px";
    app.view.style.zIndex = "-99";

    let lightBackground = PIXI.Sprite.from($("#light-texture")[0]);
    let nightBackground = PIXI.Sprite.from($("#night-texture")[0]);

    app.stage.addChild(nightBackground);
    app.stage.addChild(lightBackground);

    let textureMap = new PIXI.Sprite.from($("#texture-map")[0]);

    app.stage.addChild(textureMap);

    let depthFilter = new PIXI.filters.DisplacementFilter(textureMap);
    app.stage.filters = [ depthFilter ];

    $(window).mousemove(e => {
        depthFilter.scale.x = (window.innerWidth / 2 - e.clientX) / 80; 
        depthFilter.scale.y = (window.innerHeight / 2 - e.clientY) / 80; 
    });

    const lightMode = () => lightBackground.alpha >= 1 ? lightBackground.alpha = 1 :
        (lightBackground.alpha += 0.05, requestAnimationFrame(lightMode));

    
    const nightMode = () => lightBackground.alpha <= 0 ? lightBackground.alpha = 0 :
        (lightBackground.alpha -= 0.05, requestAnimationFrame(nightMode));

    $("#toggle").click(function() {
        if (this.textContent === "Night Mode") {

            nightMode();
            this.textContent = "Light Mode";
        } else {
            
            lightMode();
            this.textContent = "Night Mode";
        }
    })
});