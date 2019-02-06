var mr = new MatrixRenderer({
    canvasElement: document.getElementById("matrix"),
    screenWidth: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
    screenHeight: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
});
mr.start();

window.addEventListener("resize", function () {
    mr.setOption("screenWidth", window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth);
    mr.setOption("screenHeight", window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight);
});

function getRGB(nonrgb) {
    var ret = nonrgb.split(' ');
    ret = ret.map(function(c) {
        return Math.ceil(c * 255);
    });
    return "rgb(" + ret.join(',') + ")";
}

window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {

        // ++++++++++++++++++
        // +++ APPEARANCE +++
        // ++++++++++++++++++
        if (properties.appearance_backgroundcolor) {
            mr.setOption("backgroundColor", getRGB(properties.appearance_backgroundcolor.value));
        }
        if (properties.appearance_fontcolor) {
            mr.setOption("fontColor", getRGB(properties.appearance_fontcolor.value));
        }
        if (properties.appearance_fontcolorhighlight) {
            mr.setOption("fontColorHighlight", getRGB(properties.appearance_fontcolorhighlight.value));
        }
        if (properties.appearance_fontcolorshowoff) {
            mr.setOption("fontColorShowoff", getRGB(properties.appearance_fontcolorshowoff.value));
        }


        // +++++++++++++++++
        // +++ CHARACTER +++
        // +++++++++++++++++
        if (properties.character_fontsize) {
            mr.setOption("sizePerCharacter", properties.character_fontsize.value);
        }
        if (properties.character_textprefs_cyrillic) {
            mr.setOption("textRangeCyrillic", properties.character_textprefs_cyrillic.value);
        }
        if (properties.character_textprefs_letterslowercase) {
            mr.setOption("textRangeLettersLowerCase", properties.character_textprefs_letterslowercase.value);
        }
        if (properties.character_textprefs_lettersuppercase) {
            mr.setOption("textRangeLettersUpperCase", properties.character_textprefs_lettersuppercase.value);
        }
        if (properties.character_textprefs_numbers) {
            mr.setOption("textRangeNumbers", properties.character_textprefs_numbers.value);
        }
        if (properties.character_textprefs_specialchars) {
            mr.setOption("textRangeSpecialCharacters", properties.character_textprefs_specialchars.value);
        }


        // ++++++++++++++++++++++++++
        // +++ MOVEMENT BEHAVIOUR +++
        // ++++++++++++++++++++++++++
        if (properties.movementbehaviour_changecharsrandomly) {
            mr.setOption("changeCharactersRandomly", properties.movementbehaviour_changecharsrandomly.value);
        }
        if (properties.movementbehaviour_columnalphafade) {
            mr.setOption("columnAlphaFade", properties.movementbehaviour_columnalphafade.value);
        }
        if (properties.movementbehaviour_fps) {
            mr.setOption("fps", properties.movementbehaviour_fps.value);
        }
        if (properties.movementbehaviour_rain_drop_factor) {
            mr.setOption("textFactor", properties.movementbehaviour_rain_drop_factor.value / 100);
        }
    }
};
