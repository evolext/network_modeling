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
    // Описание класса контроллера
    L.Control.BigImage = L.Control.extend({
        options: {
            position: 'topright',
            title: 'Get image',
            printControlLabel: '&#128438;',
            printControlClasses: [],
            printControlTitle: 'Get image',
            _unicodeClass: 'bigimage-unicode-icon',
            highlightTitle: 'Выделить область',
            downloadTitle: 'Экспортировать выделенное'
        },

        onAdd: function (map) {
            this._map = map;

            const title = this.options.printControlTitle;
            const label = this.options.printControlLabel;
            let classes = this.options.printControlClasses;

            if (label.indexOf('&') != -1) classes.push(this.options._unicodeClass);

            return this._createControl(label, title, classes, this._click, this);
        },

        // Раскрытие полного контекстного меню по клику
        _click: function () {
            this._container.classList.add('leaflet-control-layers-expanded');
            this._containerParams.style.display = '';
            this._controlPanel.classList.add('bigimage-unicode-icon-disable');
        },

        // Создание панели, открывающейся по нажатию на иконку
        _createControl: function (label, title, classesToAdd, fn, context) {
            // Основной контейнер
            this._container = document.createElement('div');
            this._container.id = 'print-container';
            this._container.classList.add('leaflet-bar');

            // Внутренний контейнер, содержащий все кнопки "контекстного меню"
            this._containerParams = document.createElement('div');
            this._containerParams.id = 'print-params';
            this._containerParams.style.display = 'none';
            // Кнопка закрытия панели
            this._createCloseButton();
            // Кнопка выделения области для экспорта
            this._createHighlightButton();
            // Кнопка экспорта выделенного
            this._createDownloadButton();
            this._container.appendChild(this._containerParams);

            // Создание маленькой иконки, по нажатию на которую появляется все контекстное меню экспорта
            this._createControlPanel(classesToAdd, context, label, title, fn);

            L.DomEvent.disableScrollPropagation(this._container);
            L.DomEvent.disableClickPropagation(this._container);

            return this._container;
        },

        _createHighlightButton: function() {
            this._highlightBtn = document.createElement('div');
            this._highlightBtn.classList.add('download-button');
            this._highlightBtn.innerHTML = this.options.highlightTitle;

            this._highlightBtn.addEventListener('click', () => {
                this._map.off('click');
                this._map.on('click', function (e) {
                    let map_tmp = e.sourceTarget;

                    // Координаты точки, куда был клик пользователя + центр карты
                    let bounds = L.latLngBounds(e.latlng, map_tmp.getCenter());
                    
                    area = L.rectangle(bounds, {
                        color: '#f10e0e',
                        weight: 1,
                        fillOpacity: 0
                    }).addTo(map_tmp);
        
                    rectEditor = area.enableEdit();
                    
                    map.off('click');
                    // Отображаем кнопку экспорта
                    let all_cntrls = document.querySelectorAll('.download-button');
                    for (let i = 0; i < all_cntrls.length; i++)
                        all_cntrls[i].style.display = 'inline-block';
                });
                
            });
            this._containerParams.appendChild(this._highlightBtn);
        },

        _createDownloadButton: function () {
            this._downloadBtn = document.createElement('div');
            this._downloadBtn.classList.add('download-button');
            this._downloadBtn.style.display = 'none';
            this._downloadBtn.innerHTML = this.options.downloadTitle;

            this._downloadBtn.addEventListener('click', () => {
                this._containerParams.classList.add('print-disabled');
                this._loader.style.display = 'block';

                this._map.setZoom(17);
                this._map.on('zoomend', this._do.bind(this));
            });
            this._containerParams.appendChild(this._downloadBtn);
        },

        _createCloseButton: function () {
            let cross = document.createElement('div');
            cross.classList.add('close');
            // Символ "крестик"
            cross.innerHTML = '&times;';

            // Закрытие панели по нажатию на крестик
            cross.addEventListener('click', () => {
                this._container.classList.remove('leaflet-control-layers-expanded');
                this._containerParams.style.display = 'none';
                this._controlPanel.classList.remove('bigimage-unicode-icon-disable');
                // Если до этого выделяли область - то убираем ее
                if (area)
                    area.remove();
            });

            this._containerParams.appendChild(cross);
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
                resolve();
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

        _do: function() {
            this._print();
            this._map.off('zoomend');
        },

        _print: function () {
            // self - это control-панель распечатки изображения
            let self = this;
            self.tilesImgs = {};
            self.markers = {};
            self.path = {};

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

            // Создаем элемент canvas, задаем его размер, получаем контекст для дальнейшего рисования
            self.canvas = document.createElement('canvas');
            self.canvas.width = dimensions.x;
            self.canvas.height = dimensions.y;
            self.ctx = self.canvas.getContext('2d');

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
                self._downloadBtn.style.display = 'none';
                // Удаляем рамку, которой выделяли область
                area.remove();
            });

        }
    });

    // Конструктор контроллера
    L.control.bigImage = function (options) {
        return new L.Control.BigImage(options);
    };
}, window));