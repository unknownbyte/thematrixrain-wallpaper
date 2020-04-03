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
        if (properties.appearance_background_color) {
            mr.options.backgroundColor = getHex(properties.appearance_background_color.value);
        }
        if (properties.appearance_column_mode) {
            mr.options.style.column.mode = properties.appearance_column_mode.value;
        }
        if (properties.schemecolor) {
            mr.options.style.column.color = getHex(properties.schemecolor.value);
        }
        if (properties.appearance_column_color1) {
            mr.options.style.column.color1 = getHex(properties.appearance_column_color1.value);
        }
        if (properties.appearance_column_color2) {
            mr.options.style.column.color2 = getHex(properties.appearance_column_color2.value);
        }
        if (properties.appearance_highlight_enabled) {
            mr.options.style.highlight.enabled = properties.appearance_highlight_enabled.value;
        }
        if (properties.appearance_highlight_color) {
            mr.options.style.highlight.color = getHex(properties.appearance_highlight_color.value);
        }
        if (properties.appearance_tail_enabled) {
            mr.options.style.tail.enabled = properties.appearance_tail_enabled.value;
        }
        if (properties.appearance_tail_color) {
            mr.options.style.tail.color = getHex(properties.appearance_tail_color.value);
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
        if (properties.character_textprefs_chinese) {
            mr.options.textRange.chinese = properties.character_textprefs_chinese.value;
        }
        if (properties.character_textprefs_cyrillic) {
            mr.options.textRange.cyrillic = properties.character_textprefs_cyrillic.value;
        }
        if (properties.character_textprefs_hex) {
            mr.options.textRange.hex = properties.character_textprefs_hex.value;
        }
        if (properties.character_textprefs_japanese) {
            mr.options.textRange.japanese = properties.character_textprefs_japanese.value;
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
