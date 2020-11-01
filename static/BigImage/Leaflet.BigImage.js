(function (factory, window) {

    // define an AMD module that relies on 'leaflet'
    if (typeof define === 'function' && define.amd) {
        define(['leaflet'], factory);

        // define a Common JS module that relies on 'leaflet'
    } else if (typeof exports === 'object') {
        module.exports = factory(require('leaflet'));
    }

    // attach your plugin to the global 'L' variable
    if (typeof window !== 'undefined' && window.L) {
        window.L.YourPlugin = factory(L);
    }
}(function (L) {

    L.Control.BigImage = L.Control.extend({
        options: {
            position: 'topright',
            title: 'Get image',
            printControlLabel: '&#128438;',
            printControlClasses: [],
            printControlTitle: 'Get image',
            _unicodeClass: 'bigimage-unicode-icon',
            maxScale: 10,
            minScale: 1,
            inputTitle: 'Масштаб:',
            downloadTitle: 'Сохранить'
        },

        onAdd: function (map) {
            this._map = map;

            const title = this.options.printControlTitle;
            const label = this.options.printControlLabel;
            let classes = this.options.printControlClasses;

            if (label.indexOf('&') != -1) classes.push(this.options._unicodeClass);

            return this._createControl(label, title, classes, this._click, this);
        },

        _click: function (e) {
            this._container.classList.add('leaflet-control-layers-expanded');
            this._containerParams.style.display = '';
            this._controlPanel.classList.add('bigimage-unicode-icon-disable');
        },

        _createControl: function (label, title, classesToAdd, fn, context) {

            this._container = document.createElement('div');
            this._container.id = 'print-container';
            this._container.classList.add('leaflet-bar');

            this._containerParams = document.createElement('div');
            this._containerParams.id = 'print-params';
            this._containerParams.style.display = 'none';

            this._createCloseButton();

            let containerTitle = document.createElement('h6');
            containerTitle.style.width = '100%';
            containerTitle.innerHTML = this.options.inputTitle;
            this._containerParams.appendChild(containerTitle);

            this._createScaleInput();
            this._createDownloadButton();
            this._container.appendChild(this._containerParams);

            this._createControlPanel(classesToAdd, context, label, title, fn);

            L.DomEvent.disableScrollPropagation(this._container);
            L.DomEvent.disableClickPropagation(this._container);

            return this._container;
        },

        _createDownloadButton: function () {
            this._downloadBtn = document.createElement('div');
            this._downloadBtn.classList.add('download-button');

            this._downloadBtn = document.createElement('div');
            this._downloadBtn.classList.add('download-button');
            this._downloadBtn.innerHTML = this.options.downloadTitle;

            this._downloadBtn.addEventListener('click', () => {
                let scale_value = this._scaleInput.value;
                if (!scale_value || scale_value < this.options.minScale || scale_value > this.options.maxScale) {
                    this._scaleInput.value = this.options.minScale;
                    return;
                }

                this._containerParams.classList.add('print-disabled');
                this._loader.style.display = 'block';
                this._print();
            });
            this._containerParams.appendChild(this._downloadBtn);
        },

        _createScaleInput: function () {
            this._scaleInput = document.createElement('input');
            this._scaleInput.style.width = '100%';
            this._scaleInput.type = 'number';
            this._scaleInput.value = this.options.minScale;
            this._scaleInput.min = this.options.minScale;
            this._scaleInput.max = this.options.maxScale;
            this._scaleInput.id = 'scale';
            this._containerParams.appendChild(this._scaleInput);

        },

        _createCloseButton: function () {
            let span = document.createElement('div');
            span.classList.add('close');
            span.innerHTML = '&times;';

            span.addEventListener('click', () => {
                this._container.classList.remove('leaflet-control-layers-expanded');
                this._containerParams.style.display = 'none';
                this._controlPanel.classList.remove('bigimage-unicode-icon-disable');
            });

            this._containerParams.appendChild(span);
        },

        _createControlPanel: function (classesToAdd, context, label, title, fn) {
            let controlPanel = document.createElement('a');
            controlPanel.innerHTML = label;
            controlPanel.id = 'print-btn';
            controlPanel.setAttribute('title', title);
            classesToAdd.forEach(function (c) {
                controlPanel.classList.add(c);
            });
            L.DomEvent.on(controlPanel, 'click', fn, context);
            this._container.appendChild(controlPanel);
            this._controlPanel = controlPanel;

            this._loader = document.createElement('div');
            this._loader.id = 'print-loading';
            this._container.appendChild(this._loader);
        },

        // Функция получения всех существующих слоев
        _getLayers: function (resolve) {
            // self - это control-панель распечатки изображения
            let self = this;
            let promises = [];

            // Применение указанной функции ко всем слоям карты
            self._map.eachLayer(function (layer) {
                promises.push(new Promise((new_resolve) => {
                    try {
                        if (layer instanceof L.TileLayer) {
                            self._getTileLayer(layer, new_resolve);
                        } else {
                            new_resolve();
                        }
                    } catch (e) {
                        console.log(e);
                        new_resolve();
                    }
                }));
            });

            // Выполнится в случае, когда все promices выполнятся
            Promise.all(promises).then(() => {
                resolve()
            });
        },

        // Получить слой карты (функция вызывается всего один раз, т.к. слой карты один)
        // @layer - сам объект слоя
        _getTileLayer: function (layer, resolve) {
            // self - это control-панель распечатки изображения
            let self = this;

            self.tiles = [];
            // Получаем размер сетки слоя (обычно это 256)
            self.tileSize = layer._tileSize.x;

            // Считаем число клеток сетки, помещающихся в границах экрана
            self.tileBounds = L.bounds(self.bounds.min.divideBy(self.tileSize)._floor(), self.bounds.max.divideBy(self.tileSize)._floor());

            for (let j = self.tileBounds.min.y; j <= self.tileBounds.max.y; j++)
                for (let i = self.tileBounds.min.x; i <= self.tileBounds.max.x; i++)
                    self.tiles.push(new L.Point(i, j));

            let promiseArray = [];
            self.tiles.forEach(tilePoint => {
                let originalTilePoint = tilePoint.clone();
                if (layer._adjustTilePoint) layer._adjustTilePoint(tilePoint);

                let tilePos = originalTilePoint.scaleBy(new L.Point(self.tileSize, self.tileSize)).subtract(self.bounds.min);

                if (tilePoint.y < 0) return;

                promiseArray.push(new Promise(resolve => {
                    self._loadTile(tilePoint, tilePos, layer, resolve);
                }));
            });

            Promise.all(promiseArray).then(() => {
                resolve();
            });
        },

        //  @tilePoint - масштабированная
        //  @tilePos - позиция с
        //  @layer - сам слой
        _loadTile: function (tilePoint, tilePos, layer, resolve) {
            let self = this;
            let imgIndex = tilePoint.x + ':' + tilePoint.y + ':' + self.zoom;
            let image = new Image();
            image.crossOrigin = 'Anonymous';
            image.onload = function () {
                if (!self.tilesImgs[imgIndex]) self.tilesImgs[imgIndex] = {img: image, x: tilePos.x, y: tilePos.y};
                resolve();
            };
            image.src = layer.getTileUrl(tilePoint);
        },

        // Функция изменения масштаба
        _changeScale: function (scale) {
            if (!scale || scale <= 1) return 0;

            let addX = (this.bounds.max.x - this.bounds.min.x) / 2 * (scale - 1);
            let addY = (this.bounds.max.y - this.bounds.min.y) / 2 * (scale - 1);

            this.bounds.min.x -= addX;
            this.bounds.min.y -= addY;
            this.bounds.max.x += addX;
            this.bounds.max.y += addY;

            this.canvas.width *= scale;
            this.canvas.height *= scale;
        },

        _print: function () {

            // self - это control-панель распечатки изображения
            let self = this;
            self.tilesImgs = {};
            self.markers = {};
            self.path = {};

            map.setZoom(17);

            setTimeout(() => {
                // Получаем координаты рамки, пространство внутри которой будем экспортировать
                self.topLeft = area.getLatLngs()[0][1];
                self.bottomRight = area.getLatLngs()[0][3];

                let points = [map.project(self.topLeft, 17), map.project(self.bottomRight, 17)];

                // Округляем координаты двух точек
                points[0].x = Math.floor(points[0].x);
                points[0].y = Math.floor(points[0].y);

                points[1].x = Math.ceil(points[1].x);
                points[1].y = Math.ceil(points[1].y);

                // Вычисляем размерность полотна
                let dimensions = L.point(points[1].x - points[0].x, points[1].y - points[0].y);

                // При каком значении zoom делаем импорт
                self.zoom = 17;

                self.bounds = L.bounds(L.point(points[0].x, points[0].y), L.point(points[1].x, points[1].y));


                // Размер полотна с картой (= размер div контейнера)
                //let dimensions = self._map.getSize();

                // Получаем текущее значение zoom карты
                //self.zoom = self._map.getZoom();
                // Получаем пиксельные границы текущей карты (внутри div-контейнера)
                //self.bounds = self._map.getPixelBounds();

                // Создаем элемент canvas, задаем его размер, получаем контекст для дальнейшего рисования
                self.canvas = document.createElement('canvas');
                self.canvas.width = dimensions.x;
                self.canvas.height = dimensions.y;
                self.ctx = self.canvas.getContext('2d');


                // Получение значения масштаба из поля ввода
                //let scale = document.getElementById('scale').value;
                // Изменение масштаба на укзанную величину
                //this._changeScale(scale);

                let promise = new Promise(function (resolve, reject) {
                    self._getLayers(resolve);
                });

                // Когда получим все слои, то рисуем их на полотне
                promise.then(() => {
                    return new Promise(((resolve, reject) => {
                        for (const [key, value] of Object.entries(self.tilesImgs)) {
                            self.ctx.drawImage(value.img, value.x, value.y, self.tileSize, self.tileSize);
                        }
                        resolve();
                    }));
                }).then(() => {
                    self.canvas.toBlob(function (blob) {
                        let link = document.createElement('a');
                        link.download = "схема.png";
                        link.href = URL.createObjectURL(blob);
                        link.click();
                    });
                    self._containerParams.classList.remove('print-disabled');
                    self._loader.style.display = 'none';
                });
            }, 1000);

            
        }
    });

    L.control.bigImage = function (options) {
        return new L.Control.BigImage(options);
    };
}, window));