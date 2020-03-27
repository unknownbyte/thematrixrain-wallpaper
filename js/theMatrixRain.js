var mr = new MatrixRenderer({
    canvasElement: document.getElementById("matrix")
});
mr.options.screen.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
mr.options.screen.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
mr.start();

window.addEventListener("resize", function () {
    mr.options.screen.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    mr.options.screen.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeights;
});

function getHex(nonrgb) {
    let ret = nonrgb.split(' ');
    ret = ret.map(function(c) {
        return parseFloat(c);
    });
    return PIXI.utils.rgb2hex(ret);
}

window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {

        // ++++++++++++++++++
        // +++ APPEARANCE +++
        // ++++++++++++++++++
        if (properties.appearance_backgroundcolor) {
            mr.options.backgroundColor = getHex(properties.appearance_backgroundcolor.value);
        }
        if (properties.appearance_fontcolor) {
            mr.options.font.color.default = getHex(properties.appearance_fontcolor.value);
        }
        if (properties.appearance_fontcolorhighlight) {
            mr.options.font.color.highlight = getHex(properties.appearance_fontcolorhighlight.value);
        }
        if (properties.appearance_fontcolorshowoff) {
            mr.options.font.color.showoff = getHex(properties.appearance_fontcolorshowoff.value);
        }


        // +++++++++++++++++
        // +++ CHARACTER +++
        // +++++++++++++++++
        if (properties.character_fontfamily) {
            let fonts = ["Arial", "'Comic Sans MS'", "'Courier New'", "Georgia", "Impact", "'Lucida Console'", "'Times New Roman'"];
            mr.options.font.family = fonts[properties.character_fontfamily.value - 1];
        }
        if (properties.character_fontsize) {
            mr.options.font.size = properties.character_fontsize.value;
        }
        if (properties.character_textprefs_binary) {
            mr.options.textRange.binary = properties.character_textprefs_binary.value;
        }
        if (properties.character_textprefs_cyrillic) {
            mr.options.textRange.cyrillic = properties.character_textprefs_cyrillic.value;
        }
        if (properties.character_textprefs_hex) {
            mr.options.textRange.hex = properties.character_textprefs_hex.value;
        }
        if (properties.character_textprefs_letterslowercase) {
            mr.options.textRange.lettersLowerCase = properties.character_textprefs_letterslowercase.value;
        }
        if (properties.character_textprefs_lettersuppercase) {
            mr.options.textRange.lettersUpperCase = properties.character_textprefs_lettersuppercase.value;
        }
        if (properties.character_textprefs_numbers) {
            mr.options.textRange.numbers = properties.character_textprefs_numbers.value;
        }
        if (properties.character_textprefs_octal) {
            mr.options.textRange.octal = properties.character_textprefs_octal.value;
        }
        if (properties.character_textprefs_specialchars) {
            mr.options.textRange.specialCharacters = properties.character_textprefs_specialchars.value;
        }


        // ++++++++++++++++++++++++++
        // +++ MOVEMENT BEHAVIOUR +++
        // ++++++++++++++++++++++++++
        if (properties.movementbehaviour_changecharsrandomly) {
            mr.options.changeCharactersRandomly = properties.movementbehaviour_changecharsrandomly.value;
        }
        if (properties.movementbehaviour_columnalphafade) {
            mr.options.columnAlphaFade = properties.movementbehaviour_columnalphafade.value;
        }
        if (properties.movementbehaviour_fps) {
            mr.options.fps = properties.movementbehaviour_fps.value;
        }
        if (properties.movementbehaviour_rain_drop_factor) {
            mr.options.screen.rainDropFactor = properties.movementbehaviour_rain_drop_factor.value / 100;
        }
    }
};
