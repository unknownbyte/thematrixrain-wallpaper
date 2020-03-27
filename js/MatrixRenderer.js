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
            _consoleLog: null,
            _consoleInfo: null,
            _consoleWarn: null,
            _consoleError: null,
            enabled: false,
            fps: {
                add: (entry) => {
                    if (this.debug.fps._n >= 30) {
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
                customConsole: document.getElementById("debug__custom-console"),
                fpsCounter: document.getElementById("debug__fps"),
                fpsCounterAvg: document.getElementById("debug__fps-avg"),
                windowFrame: document.getElementById("debug"),
            }),
            switchToCustomConsole: () => {
                if (this.debug._consoleLog !== null) {
                    return;
                }
                this.debug._consoleLog = console.log;
                this.debug._consoleInfo = console.info;
                this.debug._consoleWarn = console.warn;
                this.debug._consoleError = console.error;
                let msgHandler = (type) => {
                    return (msg) => {
                        let entry = document.createElement("div");
                        entry.classList.add("entry");
                        entry.classList.add(type);
                        entry.innerHTML = msg;
                        this.debug.gui.customConsole.appendChild(entry);
                    }
                }
                window["console"]["log"] = msgHandler("log");
                window["console"]["info"] = msgHandler("info");
                window["console"]["warn"] = msgHandler("warn");
                window["console"]["error"] = msgHandler("error");
                this.debug.gui.customConsole.dataset.visible = true;
            },
            switchToDefaultConsole: () => {
                if (this.debug._consoleLog !== null) {
                    window["console"]["log"] = this.debug._consoleLog;
                    window["console"]["info"] = this.debug._consoleInfo;
                    window["console"]["warn"] = this.debug._consoleWarn;
                    window["console"]["error"] = this.debug._consoleError;
                    this.debug._consoleLog = null;
                    this.debug._consoleInfo = null;
                    this.debug._consoleWarn = null;
                    this.debug._consoleError = null;
                    this.debug.gui.customConsole.dataset.visible = false;
                }
            }
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
        
        let optionHandler = (prefix = "") => {
            return {
                set: (obj, prop, value) => {
                    obj[prop] = value;
                    this.applyOption(prefix + prop);
                    return true;
                }
            }
        };
        this.options = new Proxy(Object.assign({
            backgroundColor: 0x000000,
            canvasElement: null,
            changeCharactersRandomly: true,
            columnAlphaFade: true,
            font: new Proxy({
                color: new Proxy({
                    default: 0x33FF22,
                    highlight: 0xFFFFFF,
                    showoff: 0x777777,
                }, optionHandler("font.color.")),
                family: "'Courier New'",
                size: 12,
            }, optionHandler("font.")),
            fps: 30,
            screen: new Proxy({
                height: 1080,
                rainDropFactor: 0.75,
                width: 1920,
            }, optionHandler("screen.")),
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
                    this._buildTextRange();
                    return true;
                }
            }),
        }, initOptions), {
            set: (obj, prop, value) => {
                obj[prop] = value;
                if (prop == "backgroundColor" && this.render.pixi.app !== null) {
                    this.render.pixi.app.renderer.backgroundColor = value;
                    document.body.style.backgroundColor = PIXI.utils.hex2string(value);
                } else if (prop == "fps" && this.render.pixi.app !== null) {
                    this.render.pixi.app.ticker.maxFPS = value;
                }
                return true;
            }
        });

        this.render = {
            count: {
                rows: 0,
                cols: 0
            },
            isCreatingLetterTextures: false,
            isPaused: false,
            pixi: {
                app: null,
                resources: null,
            },
            shouldCreateLetterTexturesNextFrame: false,
            shouldRestartNextFrame: false,
            textcols: [],
            textRange: "?",
            textRangeAll: "?",
        };
    }
    
    _buildTextRange() {
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
        let tmpRangeAll = "";
        for (let k in this.options.textRange) {
            if (this.options.textRange.hasOwnProperty(k)) {
                tmpRangeAll += textSets[k];
                if (this.options.textRange[k] == true) {
                    tmpRange += textSets[k];
                }
            }
        }
        this.render.textRange = [...new Set((tmpRange == "" ? "?" : tmpRange).split(""))].join("");
        this.render.textRangeAll = [...new Set((tmpRangeAll == "" ? "?" : tmpRangeAll).split(""))].join("");
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
    _buildTextCols(isInit = false) {
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

    _createLetterTextures(loadCallback = () => {}) {
        if (this.render.isCreatingLetterTextures) {
            return;
        }
        this.render.isCreatingLetterTextures = true;
        if (this.debug.enabled) {
            console.info("Creating Letter Textures.");
        }
        this.render.pixi.app.loader.reset();
        this.render.pixi.app.loader.destroy();
        PIXI.utils.clearTextureCache();
        PIXI.utils.destroyTextureCache();
        let canvas = document.createElement("canvas");
        canvas.width = this.options.font.size;
        canvas.height = this.options.font.size;
        let ctx = canvas.getContext("2d");
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = this.options.font.size + "px " + this.options.font.family;
        // Create textRange + fallback letter (?) if not included in textRange
        for (let l = 0; l < this.render.textRangeAll.length; l++) {
            [
                this.options.font.color.highlight,
                this.options.font.color.default,
                this.options.font.color.showoff,
            ].forEach((v, i) => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = PIXI.utils.hex2string(v);
                ctx.fillText(
                    this.render.textRangeAll.charAt(l),
                    this.options.font.size / 2,
                    this.options.font.size / 2,
                );
                this.render.pixi.app.loader.add("l_" + i + "_" + this.render.textRangeAll.charCodeAt(l), canvas.toDataURL());
            });
        }
        // Create fallback
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.render.pixi.app.loader.add("l_blank", canvas.toDataURL());
        // Quickndirty: disable console.warn globally
        let oldConsoleWarn = console.warn;
        window["console"]["warn"] = () => {};
        this.render.pixi.app.loader.load((loader, resources) => {
            // enable it as soon as loader callback is called.
            // WHY? bc pixi.js does not provide any option to disable duplicate
            // texture warnings on load and its annoying.
            window["console"]["warn"] = oldConsoleWarn;
            this.render.pixi.resources = resources;
            loadCallback();
            this.render.isCreatingLetterTextures = false;
        });
    }

    // setup render environment and canvas
    _initializeRender() {
        if (this.debug.enabled) {
            console.info("Initializing Renderer with following options:", this.options);
        }
        this.render.pixi.app = new PIXI.Application({
            autoStart: false,
            backgroundColor: this.options.backgroundColor,
            sharedLoader: false,
            sharedTicker: false,
            view: this.options.canvasElement
        });
        this.render.pixi.app.ticker.minFPS = 1;
        this.render.pixi.app.ticker.maxFPS = this.options.fps;
        document.body.style.backgroundColor = PIXI.utils.hex2string(this.options.backgroundColor);
        this.render.pixi.app.renderer.resize(this.options.screen.width, this.options.screen.height);
        this.render.count.cols = Math.floor(this.options.screen.width / this.options.font.size);
        this.render.count.rows = Math.floor(this.options.screen.height / this.options.font.size);
        this._buildTextRange();
        this._buildTextCols(true);
        this.render.pixi.app.stage.removeChildren();
        this._createLetterTextures(() => {
            for (let c = 0; c < this.render.count.cols; c++) {
                for (let r = 0; r < this.render.count.rows; r++) {
                    let sprite = new PIXI.Sprite(this.render.pixi.resources['l_blank'].texture);
                    sprite.x = c * this.options.font.size;
                    sprite.y = r * this.options.font.size;
                    this.render.pixi.app.stage.addChild(sprite);
                }
            }
            this.render.pixi.app.start();
            this.render.pixi.app.ticker.add(() => {
                if (this.render.shouldRestartNextFrame) {
                    this.render.shouldRestartNextFrame = false;
                    this.restart();
                } else if (this.render.shouldCreateLetterTexturesNextFrame && !this.render.isCreatingLetterTextures) {
                    this.render.shouldCreateLetterTexturesNextFrame = false;
                    let isPausedCache = this.render.isPaused;
                    this.render.isPaused = true;
                    this._createLetterTextures(() => {
                        this.render.isPaused = isPausedCache;
                    });
                } else if (this.render.isPaused) {
                    return;
                } else {
                    if (this.debug.enabled) {
                        this.debug.gui.fpsCounter.innerHTML = Math.round(this.debug.fps.add(this.render.pixi.app.ticker.FPS));
                        this.debug.gui.fpsCounterAvg.innerHTML = this.debug.fps.average;
                    }
                    this._updateMatrix();
                }
            });
        });
    }

    // draw matrix
    _updateMatrix() {
        let r, c, txtc;
        for (c = 0; c < this.render.count.cols; c++) {
            txtc = this.render.textcols[c];
            if (txtc.delayedLoops > 0) {
                txtc.delayedLoops--;
            } else if (txtc.loops > txtc.dropLength + this.render.count.rows + 4) {
                this.render.textcols[c] = this._randomTextCol(false);
            } else {
                for (r = 0; r < this.render.count.rows; r++) {
                    let sprite = this.render.pixi.app.stage.getChildAt(c * this.render.count.rows + r);
                    let color = 1;//this.options.font.color.default;
                    let alpha = 1.0;
                    if (txtc.loops % this.render.count.rows == r && txtc.loops < this.render.count.rows) {
                        // highlight character
                        color = 0;//this.options.font.color.highlight;
                    } else if (txtc.loops > txtc.dropLength + 4 + r) {
                        // if dropLength + 4 + row < loops happened
                        sprite.texture = this.render.pixi.resources["l_blank"].texture;
                        continue;
                    } else if (txtc.loops > txtc.dropLength + r && txtc.loops <= txtc.dropLength + 4 + r) {
                        color = 2;//this.options.font.color.showoff;
                    }
                    if (this.options.columnAlphaFade) {
                        alpha = 1 - (txtc.loops - r) / (txtc.dropLength + 4);
                    }
                    sprite.alpha = alpha;
                    sprite.texture = this.render.pixi.resources["l_" + color + "_" + txtc.data.charCodeAt(r)].texture;
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
    
    /**
     * Starts the MatrixRenderer.
     */
    start() {
        if (this.render.pixi.app !== null) {
            if (this.debug.enabled) {
                console.error("Cannot start MatrixRenderer: Process is already running!");
            }
            return false;
        } else if (this.render.isPaused) {
            return this.togglePause();
        } else {
            if (this.debug.enabled) {
                console.info("Starting MatrixRenderer process.");
            }
            this._initializeRender();
            return true;
        } 
    }
    /**
     * Restarts the MatrixRenderer.
     */
    restart() {
        if (this.render.pixi.app === null) {
            if (this.debug.enabled) {
                console.error("Cannot restart MatrixRenderer: Process not initialized!");
            }
            return false;
        } else if (!this.stop()) {
            return false;
        }
        return this.start();
    }
    /**
     * Tries to apply settings instantly on renderer, else restarts
     * MatrixRenderer.
     * @param {string} opt The name of the option
     */
    applyOption(opt) {
        if (this.render.pixi.app === null) {
            return;
        }
        if ([
            "font.size",
            "screen.width",
            "screen.height",
            "screen.rainDropFactor",
        ].includes(opt)) {
            this.render.shouldRestartNextFrame = true;
        } else if ([
            "font.color.highlight",
            "font.color.default",
            "font.color.showoff",
            "font.family",
        ].includes(opt)) {
            // let isPausedCache = this.render.isPaused;
            // this.render.isPaused = true;
            // this._createLetterTextures(() => {
            //     this.render.isPaused = isPausedCache;
            // });
            this.render.shouldCreateLetterTexturesNextFrame = true;
        }
    }
    /**
     * Pauses the MatrixRenderer, if possible.
     */
    togglePause() {
        if (this.render.pixi.app === null) {
            if (this.debug.enabled) {
                console.error("Cannot pause MatrixRenderer: Process not initialized!");
            }
            return false;
        } else if (this.render.isPaused) {
            if (this.debug.enabled) {
                console.info("Unpausing MatrixRenderer process.");
            }
            this.render.isPaused = false;
            return true;
        } else {
            if (this.debug.enabled) {
                console.info("Pausing MatrixRenderer process.");
            }
            this.render.isPaused = true;
            return true;
        }
    }
    /**
     * Stops the MatrixRenderer, if possible.
     */
    stop() {
        if (this.render.pixi.app === null) {
            if (this.debug.enabled) {
                console.error("Cannot stop MatrixRenderer: Process not initialized!");
            }
            return false;
        } else {
            if (this.debug.enabled) {
                console.log("Stopping MatrixRenderer process.");
            }
            this.render.pixi.app.ticker.stop();
            this.render.pixi.app.stop();
            this.render.pixi.app.loader.reset();
            this.render.pixi.app.loader.destroy();
            this.render.pixi.app.stage.removeChildren();
            this.render.pixi.app.render();
            this.render.pixi.app.stop();
            this.render.pixi.app.destroy(false, true);
            PIXI.utils.clearTextureCache();
            PIXI.utils.destroyTextureCache();
            this.render.pixi.app = null;
            this.render.isCreatingLetterTextures = false;
            this.render.isPaused = false;
            this.render.shouldCreateLetterTexturesNextFrame = false;
            this.render.shouldRestartNextFrame = false;
            return true;
        }
    }
}

// End of MatrixRenderer.js
