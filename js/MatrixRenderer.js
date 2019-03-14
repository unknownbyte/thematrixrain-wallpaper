/*!
 * MatrixRenderer.js
 * 
 * Class for rendering a Matrix Rain on a canvas.
 * 
 * Copyright (c) 2019 Patrick Goldinger. All rights reserved.
 * 
 */


/**
 * The main object for rendering the matrix.
 * @param {Object} initOptions Initial options for MatrixRenderer.
 */
const MatrixRenderer = function (initOptions = {}) {

    // private variables
    var render = {
        ctx: null,
        count: {
            rows: 0,
            cols: 0
        },
        isPaused: false,
        rafID: 0,
        rafStartTime: 0,
        textcols: [],
        textRange: "?"
    };

    // private functions
    function prepareTextRange() {
        const textPrefs = {
            cyrillic: options.textRangeCyrillic,
            lettersLowerCase: options.textRangeLettersLowerCase,
            lettersUpperCase: options.textRangeLettersUpperCase,
            numbers: options.textRangeNumbers,
            specialCharacters: options.textRangeSpecialCharacters
        };
        const textSets = {
            cyrillic: "аАбБвВгГдДеЕёЁжЖзЗиИйЙкКлЛмМнНоОпПрРсСтТуУфФхХцЦчЧшШщЩъЪыЫьЬэЭюЮяЯ",
            lettersLowerCase: "abcdefghijklmnopqrstuvwxyz",
            lettersUpperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            numbers: "0123456789",
            specialCharacters: ",;.:-_+*~#'^°!\"§$%&/()=?{[]}\\@€"
        };
        var retRange = "";
        for (var k in textPrefs) {
            if (textPrefs.hasOwnProperty(k)) {
                if (textPrefs[k] == true)
                    retRange += textSets[k];
            }
        }
        return retRange == "" ? "?" : retRange;
    }
    function randomTextFromRange(count, textRange) {
        var retText = "";
        for (var i = 0; i < count; i++)
            retText += textRange.charAt(Math.floor(Math.random() * textRange.length));
      
        return retText;
    }
    function randomTextCol(isInit = false) {
        return {
            data: randomTextFromRange(render.count.rows, render.textRange),
            delayedLoops: Math.floor(Math.random() * 140) % (isInit ? 135 : 40),
            loops: 0,
            dropLength: Math.floor(render.count.rows * options.textFactor)
        };
    }
    function prepareTextCols(isInit = false) {
        var c;
        for (c = 0; c < render.count.cols; c++) {
            render.textcols[c] = randomTextCol(isInit);
        }
    }
    function changeTextFromTextCols() {
        var c, cc, ccMax = Math.floor(Math.random() * 100) % Math.floor(render.count.rows / 8), rpos;
        for (c = 0; c < render.count.cols; c++) {
            var txtcTmp = render.textcols[c].data.split("");
            var txtRangeTmp = randomTextFromRange(render.count.rows, render.textRange);
            for (cc = 0; cc < ccMax; cc++) {
                rpos = Math.floor(Math.random() * 100) % (render.count.rows);
                txtcTmp[rpos] = txtRangeTmp[rpos];
            }
            render.textcols[c].data = txtcTmp.join("");
        }
    }
    // setup render environment and canvas
    function initializeRender() {
        console.info("Initializing Renderer with following options:", options);
        // # CANVAS #
        options.canvasElement.setAttribute("width", options.screenWidth);
        options.canvasElement.setAttribute("height", options.screenHeight);
        // # RENDER #
        render.count.cols = Math.floor(options.screenWidth / options.sizePerCharacter);
        render.count.rows = Math.floor(options.screenHeight / options.sizePerCharacter);
        render.ctx = options.canvasElement.getContext("2d");
        render.ctx.font = options.sizePerCharacter + "px monospace";
        render.ctx.textAlign = "center";
        render.ctx.textBaseline = "middle";
        prepareTextCols(true);
    }
    // draw matrix
    function drawMatrix() {
        // register next call
        render.rafID = window.requestAnimationFrame(drawMatrix);
        var ellapsed = Date.now() - render.rafStartTime;
        if (ellapsed > (1000 / options.fps)) {
            render.rafStartTime = Date.now() - (ellapsed % (1000 / options.fps));
            // # CLEANUP #
            render.ctx.clearRect(0, 0, options.canvasElement.width, options.canvasElement.height);
            options.canvasElement.style.backgroundColor = options.backgroundColor;
            render.ctx.globalAlpha = 1.0;
            var r, c, txtc;
            for (c = 0; c < render.count.cols; c++) {
                txtc = render.textcols[c];
                if (txtc.delayedLoops > 0)
                    txtc.delayedLoops--;
                else if (txtc.loops > txtc.dropLength + render.count.rows + 4) {
                    render.textcols[c] = randomTextCol(false);
                }
                else {
                    //render.ctx.globalAlpha = txtc.alpha;
                    for (r = 0; r < render.count.rows; r++) {
                        render.ctx.fillStyle = options.fontColor;
                        // highlight character
                        if (txtc.loops % render.count.rows == r && txtc.loops < render.count.rows)
                            render.ctx.fillStyle = options.fontColorHighlight;
                        // if dropLength + 4 + row < loops happened
                        else if (txtc.loops > txtc.dropLength + 4 + r)
                            continue;
                        else if (txtc.loops > txtc.dropLength + r && txtc.loops <= txtc.dropLength + 4 + r)
                            render.ctx.fillStyle = options.fontColorShowoff;
                        if (options.columnAlphaFade)
                            render.ctx.globalAlpha = 1 - (txtc.loops - r) / (txtc.dropLength + 4);
                        render.ctx.fillText(
                            txtc.data.charAt(r),
                            c * options.sizePerCharacter + options.sizePerCharacter / 2, 
                            r * options.sizePerCharacter + options.sizePerCharacter / 2
                        );
                        // if highlight character -> break
                        if (txtc.loops % render.count.rows == r && txtc.loops < render.count.rows)
                            break;
                    }
                    txtc.loops++;
                }
            }
            if (options.changeCharactersRandomly) {
                changeTextFromTextCols();
            }
        }
    }

    // initialize options
    var options = Object.assign({
        backgroundColor: "#000",
        canvasElement: null,
        changeCharactersRandomly: true,
        columnAlphaFade: true,
        fontColor: "#3f2",
        fontColorHighlight: "#fff",
        fontColorShowoff: "#777",
        fps: 24,
        screenHeight: 1080,
        screenWidth: 1920,
        sizePerCharacter: 12,
        textFactor: 0.75,
        textRangeCyrillic: true,
        textRangeLettersLowerCase: true,
        textRangeLettersUpperCase: true,
        textRangeNumbers: true,
        textRangeSpecialCharacters: true
    }, initOptions);
    
    /**
     * Starts the MatrixRenderer.
     */
    this.start = function () {
        if (!render.isPaused) {
            console.log("Starting MatrixRenderer...");
            render.textRange = prepareTextRange();
            initializeRender();
        }
        else {
            render.isPaused = false;
        }
        render.rafStartTime = Date.now();
        drawMatrix();
    }
    /**
     * Pauses the MatrixRenderer, if possible.
     */
    this.pause = function () {
        if (render.ctx == null) {
            console.error("Cannot pause MatrixRenderer: Process not initialized!");
        }
        else {
            console.log("Pausing MatrixRenderer...");
            window.cancelAnimationFrame(render.rafID);
            render.isPaused = true;
        }
    }
    /**
     * Stops the MatrixRenderer, if possible.
     */
    this.stop = function () {
        if (render.ctx == null) {
            console.error("Cannot stop MatrixRenderer: Process not initialized!");
        }
        else {
            console.log("Stopping MatrixRenderer...");
            window.cancelAnimationFrame(render.rafID);
            render.ctx.clearRect(0, 0, options.canvasElement.width, options.canvasElement.height);
            render.ctx = null;
            render.isPaused = false;
        }
    }

    /**
     * Returns the value for the given key.
     * @param {string} key - The key.
     */
    this.getOption = function (key) {
        return options[key];
    }
    /**
     * Sets the value for the given key.
     * On some properties a reload is needed, this is done automatically.
     * @param {string} key - The key.
     * @param value - The value.
     */
    this.setOption = function (key, value) {
        options[key] = value;
        if (key.startsWith("textRange")) {
            render.textRange = prepareTextRange();
        }
        else if (["screenWidth", "screenHeight", "sizePerCharacter", "textFactor"].includes(key)) {
            initializeRender();
        }
    }

}

// End of MatrixRenderer.js
