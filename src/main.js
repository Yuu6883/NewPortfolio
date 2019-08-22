const $ = window.$ = require("jquery");
const PIXI = require("pixi.js");

$(window).on("load", () => {

    setTimeout(() => {
        $(".logo").hide();
        $(".logo-static")
            .show()
            .animate({ top: "60%" }, 200, function() {
                $(this).animate({ top: "0%", marginTop: "10px" }, 500, () => {
                    $(this).addClass("night-logo");
                    $("#main-panel").fadeIn();
                    init();
                });
            });
    }, 600);
    
});

const clamp = (value, min, max) => value < min ? min : (value > max ? max : value);

const DesktopFactor = 80;
const MobileFactor = 30;

const init = () => {

    let app = new PIXI.Application({ width: window.innerWidth, height: window.innerHeight, backgroundColor: 0xffffff });
    app.renderer.plugins.interaction.autoPreventDefault = false;

    $(app.view)
        .css("position", "fixed")
        .css("top", "0px")
        .css("left", "0px")
        .css("display", "none")
        .fadeIn(1000);

    document.body.append(app.view);

    let mobile = (window.innerWidth < window.innerHeight);
    let lightBackground = PIXI.Sprite.from($(mobile ? "#geisel-light-texture" : "#light-texture")[0]);
    let nightBackground = PIXI.Sprite.from($(mobile ? "#geisel-night-texture" : "#night-texture")[0]);

    app.stage.addChild(nightBackground);
    app.stage.addChild(lightBackground);

    let textureMap = PIXI.Sprite.from($(mobile ? "#geisel-texture-map" : "#texture-map")[0]);

    app.stage.addChild(textureMap);

    let depthFilter = new PIXI.filters.DisplacementFilter(textureMap);
    app.stage.filters = [ depthFilter ];

    lightBackground.anchor.set(0.5, 0.5);
    nightBackground.anchor.set(0.5, 0.5);
    textureMap.anchor.set(0.5, 0.5);

    let currentPos = { x: 0, y: 0 };
    /** @type {JQuery.MouseMoveEvent|JQuery.TouchMoveEvent} */
    let lastEvent;

    /** @param {JQuery.MouseMoveEvent|JQuery.TouchMoveEvent} e */
    const changeView = (e, touch) => {
        
        if (touch) {
            // console.log(currentPos.x, currentPos.y);
            e.clientX = e.touches[0].pageX;
            e.clientY = e.touches[0].pageY;
            e.preventDefault();
        }

        if (!lastEvent) return void(lastEvent = e);
        let deltaX = e.clientX - lastEvent.clientX; 
        let deltaY = e.clientY - lastEvent.clientY;

        let x = currentPos.x + deltaX;
        let y = currentPos.y + deltaY;

        currentPos.x = x = clamp(x, -lightBackground.width / 2, lightBackground.width / 2);
        currentPos.y = y = clamp(y, -lightBackground.height / 2, lightBackground.height / 2);

        let factor = touch ? MobileFactor : DesktopFactor;
        depthFilter.scale.set(x / factor, y / factor);

        lastEvent = e;
    }

    $(window)
        .bind("mousemove", changeView)
        .bind("touchmove", e => changeView(e, true));

    const lightMode = () => lightBackground.alpha >= 1 ? lightBackground.alpha = 1 :
        (lightBackground.alpha += 0.05, requestAnimationFrame(lightMode));

    
    const nightMode = () => lightBackground.alpha <= 0 ? lightBackground.alpha = 0 :
        (lightBackground.alpha -= 0.05, requestAnimationFrame(nightMode));

    $("#toggle").click(function() {

        let content = $(this).children().eq(1);

        $(".logo").toggleClass("night-logo light-logo");
        $(".nav-button").toggleClass("theme-color white");
        $("#nav-bar").toggleClass("theme-color");

        if (content.text() === "Night Mode") {

            nightMode();
            content.text("Light Mode");
        } else {

            lightMode();
            content.text("Night Mode");
        }
    });

    const resize = () => {

        app.view.width = app.view.style.width = window.innerWidth;
        app.view.height = app.view.style.height = window.innerHeight;

        let hw = window.innerWidth / 2, hh = window.innerHeight / 2;
        lightBackground.position.set(hw, hh);
        nightBackground.position.set(hw, hh);
        textureMap.position.set(hw, hh);

        let ratio = hh / hw;
        let scale = ratio > lightBackground.height / lightBackground.width ?
            window.innerHeight / lightBackground.height :
            window.innerWidth / lightBackground.width;

        textureMap.scale.set(scale);
        nightBackground.scale.set(scale);
        lightBackground.scale.set(scale);

    }
    
    $(window).resize(resize).bind("orientationchange", resize);
    resize();
}