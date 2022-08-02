const $ = (window.$ = require("jquery"));
const PIXI = require("pixi.js");
const Swal = require("sweetalert2").default;

const clamp = (value, min, max) =>
    value < min ? min : value > max ? max : value;

const DesktopFactor = 80;
const MobileFactor = 30;

document.body.onload = () => {
    const app = new PIXI.Application({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0xffffff,
    });
    app.renderer.plugins.interaction.autoPreventDefault = false;

    $(".read-more").on("click", () => {
        Swal.fire({
            title: "Ops...",
            html: "This function is currently unavailable.",
            type: "warning",
        });
    });

    document.body.append(app.view);

    const mobile = window.innerWidth < window.innerHeight;
    const lightBackground = PIXI.Sprite.from(
        mobile ? "img/geisel-light.jpg" : "img/light.png"
    );
    const nightBackground = PIXI.Sprite.from(
        mobile ? "img/geisel-night.jpg" : "img/night.png"
    );
    const depthMap = PIXI.Sprite.from(
        mobile ? "img/geisel-map.jpg" : "img/map.png"
    );

    app.stage.addChild(nightBackground);
    app.stage.addChild(lightBackground);
    app.stage.addChild(depthMap);

    nightBackground.position.set(0, 0);
    lightBackground.position.set(0, 0);
    depthMap.position.set(0, 0);

    const depthFilter = new PIXI.filters.DisplacementFilter(depthMap);
    app.stage.filters = [depthFilter];

    const r = (a, b) =>
        (Math.random() < 0.5 ? -1 : 1) * (a + Math.random() * (b - a));

    let currentPos = { x: 0, y: 0 };
    let dir = { x: r(4, 8), y: r(4, 8) };
    /** @type {JQuery.MouseMoveEvent|JQuery.TouchMoveEvent} */
    let lastEvent;
    let timestamp = Date.now();

    /** @param {JQuery.MouseMoveEvent|JQuery.TouchMoveEvent} e */
    const changeView = (e, touch) => {
        if (touch) {
            e.clientX = e.touches[0].pageX;
            e.clientY = e.touches[0].pageY;
        }

        if (!lastEvent) return void (lastEvent = e);
        const deltaX = e.clientX - lastEvent.clientX;
        const deltaY = e.clientY - lastEvent.clientY;

        let x = currentPos.x + deltaX;
        let y = currentPos.y + deltaY;

        currentPos.x = x = clamp(
            x,
            -lightBackground.width / 2,
            lightBackground.width / 2
        );
        currentPos.y = y = clamp(
            y,
            -lightBackground.height / 2,
            lightBackground.height / 2
        );

        let factor = touch ? MobileFactor : DesktopFactor;
        depthFilter.scale.set(x / factor, y / factor / (touch ? 2 : 1));

        lastEvent = e;
        timestamp = Date.now();
    };

    // Update view
    const update = () => {
        if (depthMap.texture.valid) {
            app.view.width = depthMap.width;
            app.view.height = depthMap.height;
            app.view.style.opacity = "100%";
            app.renderer.resize(depthMap.width, depthMap.height);
        }
        requestAnimationFrame(update);

        if (lastEvent && Date.now() - timestamp < 3000) return;

        let x = currentPos.x + dir.x;
        let y = currentPos.y + dir.y;
        const hw = lightBackground.width / 2;
        const hh = lightBackground.height / 2;

        // Bounce
        if (x < -hw || x > hw) dir.x = -dir.x;
        if (y < -hh || y > hh) dir.y = -dir.y;

        currentPos.x = x = clamp(x, -hw, hw);
        currentPos.y = y = clamp(y, -hh, hh);

        depthFilter.scale.set(x / DesktopFactor, y / DesktopFactor);
    };

    requestAnimationFrame(update);

    $(window)
        .on("mousemove", changeView)
        .on("touchmove", (e) => changeView(e, true));

    let modeChanging = false;

    const lightMode = () => {
        if (lightBackground.alpha >= 1) {
            lightBackground.alpha = 1;
            modeChanging = false;
        } else {
            (lightBackground.alpha += 0.05), requestAnimationFrame(lightMode);
            modeChanging = true;
        }
    };

    const nightMode = () => {
        if (lightBackground.alpha <= 0) {
            lightBackground.alpha = 0;
            modeChanging = false;
        } else {
            (lightBackground.alpha -= 0.05), requestAnimationFrame(nightMode);
            modeChanging = true;
        }
    };

    if (!localStorage.light) {
        nightMode();
        $("#toggle").children().eq(1).text("Light Mode");
        $(":root")
            .prop("style")
            .setProperty("--light-theme-background", " white ");
        $(":root")
            .prop("style")
            .setProperty("--background", " rgba(255,255,255,0.1) ");
    }

    $("#toggle").on("click", function () {
        if (modeChanging) return;

        let content = $(this).children().eq(1);

        if (content.text() === "Night Mode") {
            // Switching to night mode
            nightMode();
            content.text("Light Mode");
            $(":root")
                .prop("style")
                .setProperty("--light-theme-background", " white ");
            $(":root")
                .prop("style")
                .setProperty("--background", " rgba(255,255,255,0.1) ");

            delete localStorage.light;
        } else {
            // Switching to light mode
            lightMode();
            content.text("Night Mode");
            $(":root")
                .prop("style")
                .setProperty("--light-theme-background", " #3d4345 ");
            $(":root")
                .prop("style")
                .setProperty("--background", " rgba(255,255,255,0.25) ");

            localStorage.light = "y";
        }
    });
};
