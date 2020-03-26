/*!
 * MatrixRenderer.js
 * 
 * Class for rendering a Matrix Rain on a canvas.
 * 
 * Copyright (c) 2019 unknownbyte
 * Licensed under the MIT License (see LICENSE file for details)
 * 
 */


/**
 * The main object for rendering the matrix.
 * @param {Object} initOptions Initial options for MatrixRenderer.
 */
class MatrixRenderer {
    constructor (initOptions = {}, isDebugEnabled = false) {
        this.debug = new Proxy({
            enabled: false,
            fps: {
                add: (entry) => {
                    if (this.debug.fps._n >= 60) {
                        this.debug.fps._n = 0;
                    }
                    this.debug.fps._dataset[this.debug.fps._n++] = entry;
                    let sum = this.debug.fps._dataset.reduce((acc, cur) => acc + cur);
                    this.debug.fps.average = Math.round(sum / this.debug.fps._dataset.length);
                    return entry;
                },
                average: 0,
                _dataset: [],
                _n: 0
            },
            gui: Object.freeze({
                fpsCounter: document.getElementById("debug__fps"),
                fpsCounterAvg: document.getElementById("debug__fps-avg"),
                windowFrame: document.getElementById("debug"),
            })
        }, {
            set: (obj, prop, value) => {
                if (prop === "enabled") {
                    if (typeof value !== "boolean") {
                        throw new TypeError("Only boolean allowed!");
                    } else {
                        this.debug.gui.windowFrame.dataset.visible = value;
                    }
                }
                obj[prop] = value;
                return true;
            }
        });
        this.debug.enabled = isDebugEnabled;
        
        this.options = Object.assign({
            backgroundColor: "#000",
            canvasElement: null,
            changeCharactersRandomly: true,
            columnAlphaFade: true,
            font: new Proxy({
                color: {
                    default: "#3f2",
                    highlight: "#fff",
                    showoff: "#777",
                },
                family: "'Courier New'",
                size: 12,
            }, {
                set: (obj, prop, value) => {
                    obj[prop] = value; // must be before ifs or it causes problems
                    if (prop === "family") {
                        this.render.ctx.font = this.options.font.size + "px " + this.options.font.family;
                    } else if (prop === "size") {
                        this._initializeRender();
                    }
                    return true;
                }
            }),
            fps: 24,
            screen: new Proxy({
                height: 1080,
                rainDropFactor: 0.75,
                width: 1920,
            }, {
                set: (obj, prop, value) => {
                    obj[prop] = value;
                    this._initializeRender();
                    return true;
                }
            }),
            textRange: new Proxy({
                binary: false,
                cyrillic: true,
                hex: false,
                lettersLowerCase: true,
                lettersUpperCase: true,
                numbers: true,
                octal: false,
                specialCharacters: true,
            }, {
                set: (obj, prop, value) => {
                    obj[prop] = value;
                    this._prepareTextRange();
                    return true;
                }
            }),
        }, initOptions);

        this.render = {
            ctx: null,
            count: {
                rows: 0,
                cols: 0
            },
            isPaused: false,
            rafID: 0,
            rafStartTime: 0,
            textcols: [],
            textRange: "?",
        };
    }
    
    _prepareTextRange() {
        const textSets = {
            binary:             "01",
            cyrillic:           "аАбБвВгГдДеЕёЁжЖзЗиИйЙкКлЛмМнНоОпПрРсСтТуУфФхХцЦчЧшШщЩъЪыЫьЬэЭюЮяЯ",
            hex:                "0123456789ABCDEF",
            lettersLowerCase:   "abcdefghijklmnopqrstuvwxyz",
            lettersUpperCase:   "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            numbers:            "0123456789",
            octal:              "01234567",
            specialCharacters:  ",;.:-_+*~#'^°!\"§$%&/()=?{[]}\\@€"
        };
        let tmpRange = "";
        for (let k in this.options.textRange) {
            if (this.options.textRange.hasOwnProperty(k)) {
                if (this.options.textRange[k] == true) {
                    tmpRange += textSets[k];
                }
            }
        }
        this.render.textRange = tmpRange == "" ? "?" : tmpRange;
    }
    _randomTextFromRange(count, textRange) {
        let retText = "";
        for (let i = 0; i < count; i++)
            retText += textRange.charAt(Math.floor(Math.random() * textRange.length));
      
        return retText;
    }
    _randomTextCol(isInit = false) {
        return {
            data: this._randomTextFromRange(this.render.count.rows, this.render.textRange),
            delayedLoops: Math.floor(Math.random() * 140) % (isInit ? 135 : 40),
            dropLength: Math.floor(this.render.count.rows * this.options.screen.rainDropFactor),
            loops: 0
        };
    }
    _prepareTextCols(isInit = false) {
        for (let c = 0; c < this.render.count.cols; c++) {
            this.render.textcols[c] = this._randomTextCol(isInit);
        }
    }
    _changeTextFromTextCols() {
        let c, cc, ccMax = Math.floor(Math.random() * 100) % Math.floor(this.render.count.rows / 8), rpos;
        for (c = 0; c < this.render.count.cols; c++) {
            let txtcTmp = this.render.textcols[c].data.split("");
            let txtRangeTmp = this._randomTextFromRange(this.render.count.rows, this.render.textRange);
            for (cc = 0; cc < ccMax; cc++) {
                rpos = Math.floor(Math.random() * 100) % (this.render.count.rows);
                txtcTmp[rpos] = txtRangeTmp[rpos];
            }
            this.render.textcols[c].data = txtcTmp.join("");
        }
    }
    _timeNow() {
        return performance.timing.navigationStart + performance.now();
    }

    // setup render environment and canvas
    _initializeRender() {
        if (this.debug.enabled) {
            console.info("Initializing Renderer with following options:", this.options);
        }
        // # CANVAS #
        this.options.canvasElement.setAttribute("width", this.options.screen.width);
        this.options.canvasElement.setAttribute("height", this.options.screen.height);
        // # RENDER #
        this.render.count.cols = Math.floor(this.options.screen.width / this.options.font.size);
        this.render.count.rows = Math.floor(this.options.screen.height / this.options.font.size);
        this.render.ctx = this.options.canvasElement.getContext("2d");
        this.render.ctx.font = this.options.font.size + "px " + this.options.font.family;
        this.render.ctx.textAlign = "center";
        this.render.ctx.textBaseline = "middle";
        this._prepareTextRange();
        this._prepareTextCols(true);
    }
    // draw matrix
    _drawMatrix() {
        // register next call
        this.render.rafID = window.requestAnimationFrame(() => this._drawMatrix());
        let ellapsed = this._timeNow() - this.render.rafStartTime;
        if (ellapsed > (1000 / this.options.fps)) {
            if (this.debug.enabled) {
                this.debug.gui.fpsCounter.innerHTML = this.debug.fps.add(Math.round(1/(ellapsed/1000)));
                this.debug.gui.fpsCounterAvg.innerHTML = this.debug.fps.average;
            }
            this.render.rafStartTime = Date.now() - (ellapsed % (1000 / this.options.fps));
            // # CLEANUP #
            this.render.ctx.clearRect(0, 0, this.options.canvasElement.width, this.options.canvasElement.height);
            this.options.canvasElement.style.backgroundColor = this.options.backgroundColor;
            this.render.ctx.globalAlpha = 1.0;
            let r, c, txtc, size = this.options.font.size;
            for (c = 0; c < this.render.count.cols; c++) {
                txtc = this.render.textcols[c];
                if (txtc.delayedLoops > 0)
                    txtc.delayedLoops--;
                else if (txtc.loops > txtc.dropLength + this.render.count.rows + 4) {
                    this.render.textcols[c] = this._randomTextCol(false);
                }
                else {
                    for (r = 0; r < this.render.count.rows; r++) {
                        let color = this.options.font.color.default;
                        if (txtc.loops % this.render.count.rows == r && txtc.loops < this.render.count.rows) {
                            // highlight character
                            color = this.options.font.color.highlight;
                        } else if (txtc.loops > txtc.dropLength + 4 + r) {
                            // if dropLength + 4 + row < loops happened
                            continue;
                        } else if (txtc.loops > txtc.dropLength + r && txtc.loops <= txtc.dropLength + 4 + r) {
                            color = this.options.font.color.showoff;
                        }
                        if (this.options.columnAlphaFade) {
                            this.render.ctx.globalAlpha = 1 - (txtc.loops - r) / (txtc.dropLength + 4);
                        }
                        this.render.ctx.fillStyle = color;
                        this.render.ctx.fillText(
                            txtc.data.charAt(r),
                            c * size + size / 2,
                            r * size + size / 2,
                        );
                        // if highlight character -> break
                        if (txtc.loops % this.render.count.rows == r && txtc.loops < this.render.count.rows) {
                            break;
                        }
                    }
                    txtc.loops++;
                }
            }
            if (this.options.changeCharactersRandomly) {
                this._changeTextFromTextCols();
            }
        }
    }
    
    /**
     * Starts the MatrixRenderer.
     */
    start() {
        if (!this.render.isPaused) {
            if (this.debug.enabled) {
                console.log("Starting MatrixRenderer...");
            }
            this._prepareTextRange();
            this._initializeRender();
        }
        else {
            this.render.isPaused = false;
        }
        this.render.rafStartTime = this._timeNow();
        this._drawMatrix();
    }
    /**
     * Pauses the MatrixRenderer, if possible.
     */
    pause() {
        if (this.render.ctx == null) {
            if (this.debug.enabled) {
                console.error("Cannot pause MatrixRenderer: Process not initialized!");
            }
        }
        else {
            if (this.debug.enabled) {
                console.log("Pausing MatrixRenderer...");
            }
            window.cancelAnimationFrame(this.render.rafID);
            this.render.isPaused = true;
        }
    }
    /**
     * Stops the MatrixRenderer, if possible.
     */
    stop() {
        if (this.render.ctx == null) {
            if (this.debug.enabled) {
                console.error("Cannot stop MatrixRenderer: Process not initialized!");
            }
        }
        else {
            if (this.debug.enabled) {
                console.log("Stopping MatrixRenderer...");
            }
            window.cancelAnimationFrame(this.render.rafID);
            this.render.ctx.clearRect(0, 0, this.options.canvasElement.width, this.options.canvasElement.height);
            this.render.ctx = null;
            this.render.isPaused = false;
        }
    }
}

// End of MatrixRenderer.js
