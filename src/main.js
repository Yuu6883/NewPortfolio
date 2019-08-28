const $ = window.$ = require("jquery");
const PIXI = require("pixi.js");
const Swal = require("sweetalert2").default;

$(window).on("load", () => {

    setTimeout(() => {
        $(".logo").hide();
        $(".logo-static")
            .show()
            .animate({ top: "60%" }, 200, function() {
                $(this).animate({ top: "-20%", marginTop: "10px" }, 500, () => {
                    // $(this).addClass("night-logo");
                    $(this).fadeOut();
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

    $(".read-more").click(() => {
        Swal.fire({
            title: "Ops...",
            html: "This function is currently unavailable.",
            type: "warning"
        })
    });

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
    let textureMap = PIXI.Sprite.from($(mobile ? "#geisel-texture-map" : "#texture-map")[0]);

    app.stage.addChild(nightBackground);
    app.stage.addChild(lightBackground);
    app.stage.addChild(textureMap);

    let depthFilter = new PIXI.filters.DisplacementFilter(textureMap);
    app.stage.filters = [ depthFilter ];

    lightBackground.anchor.set(0.5, 0.5);
    nightBackground.anchor.set(0.5, 0.5);
    textureMap.anchor.set(0.5, 0.5);

    const r = (a, b) => (Math.random() < 0.5 ? -1 : 1) * (a + Math.random() * (b - a));

    let currentPos = { x: 0, y: 0 };
    let dir = { x: r(4, 8), y: r(4, 8) };
    /** @type {JQuery.MouseMoveEvent|JQuery.TouchMoveEvent} */
    let lastEvent;
    let timestamp;

    /** @param {JQuery.MouseMoveEvent|JQuery.TouchMoveEvent} e */
    const changeView = (e, touch) => {
        
        if (touch) {
            e.clientX = e.touches[0].pageX;
            e.clientY = e.touches[0].pageY;
        }

        if (!lastEvent) return void(lastEvent = e);
        let deltaX = e.clientX - lastEvent.clientX; 
        let deltaY = e.clientY - lastEvent.clientY;

        let x = currentPos.x + deltaX;
        let y = currentPos.y + deltaY;

        currentPos.x = x = clamp(x, -lightBackground.width / 2, lightBackground.width / 2);
        currentPos.y = y = clamp(y, -lightBackground.height / 2, lightBackground.height / 2);

        let factor = touch ? MobileFactor : DesktopFactor;
        depthFilter.scale.set(x / factor, y / factor / (touch ? 2 : 1));

        lastEvent = e;
        timestamp = Date.now();
    }

    // Update view
    setInterval(() => {
        if (lastEvent && (Date.now() - timestamp < 3000)) return;

        let x = currentPos.x + dir.x;
        let y = currentPos.y + dir.y;
        let hw = lightBackground.width / 2;
        let hh = lightBackground.height / 2;

        // Bounce
        if (x < -hw || x > hw) dir.x = -dir.x;
        if (y < -hh || y > hh) dir.y = -dir.y;

        currentPos.x = x = clamp(x, -hw, hw);
        currentPos.y = y = clamp(y, -hh, hh);

        depthFilter.scale.set(x / DesktopFactor, y / DesktopFactor);
    }, 15);

    $(window)
        .bind("mousemove", changeView)
        .bind("touchmove", e => changeView(e, true));

    let modeChanging = false;

    const lightMode = () => {
        if (lightBackground.alpha >= 1) {
            lightBackground.alpha = 1;
            modeChanging = false;
        } else {
            lightBackground.alpha += 0.05, requestAnimationFrame(lightMode);
            modeChanging = true;
        }
    }

    
    const nightMode = () => {
        if (lightBackground.alpha <= 0) {
            lightBackground.alpha = 0;
            modeChanging = false;
        } else {
            lightBackground.alpha -= 0.05, requestAnimationFrame(nightMode);
            modeChanging = true;
        }
    }

    if (!localStorage.light) {
        nightMode();
        $("#toggle").children().eq(1).text("Light Mode");
        $(":root").prop("style").setProperty("--light-theme-background", " white ");
        $(":root").prop("style").setProperty("--background", " rgba(255,255,255,0.1) ");
    }

    $("#toggle").click(function() {

        if (modeChanging) return;
        
        let content = $(this).children().eq(1);

        if (content.text() === "Night Mode") {
            // Switching to night mode
            nightMode();
            content.text("Light Mode");
            $(":root").prop("style").setProperty("--light-theme-background", " white ");
            $(":root").prop("style").setProperty("--background", " rgba(255,255,255,0.1) ");

            delete localStorage.light;
            
        } else {
            // Switching to light mode
            lightMode();
            content.text("Night Mode");
            $(":root").prop("style").setProperty("--light-theme-background", " rgb(1, 88, 127) ");
            $(":root").prop("style").setProperty("--background", " rgba(255,255,255,0.75) ");

            localStorage.light = "y";
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

        // console.log(`Image Ratio: ${(lightBackground.height / lightBackground.width).toFixed(3)}`);

        textureMap.scale.set(scale + 0.1);
        nightBackground.scale.set(scale + 0.1);
        lightBackground.scale.set(scale + 0.1);

    }
    
    $(window).resize(resize).bind("orientationchange", resize);
    resize();
}