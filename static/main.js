var app = {
    // Тип редактируемой сети (ВС по умолчанию)
    mode: "NONE",
    // Глобальный счетчик для нумерации объектов
    id: 0,
    // Инициализированные геообъекты
    geoObjects: [],
    // Инициализированные участки
    pipes: new Map(),
    // Характериситки элементов сети
    objectsInfo: new Map(),
    // Декораторы участков
    pipesArrows: new Map(),
    // Редактор участка
    polylineEditor: undefined,
    // Идентификаторр редактируемого пайпа
    editableId: null,
    // Контекстное меню редактируемого пайпа
    editablePopup: null,
    // Контекстное меню пайпа, доступное до редактирования
    pipePopup: null
}


// Создание объекта карты
app.map = L.map("map", {
    attributionControl: false,
    zoomControl: false,
    center: [54.992265230059814, 82.91812709398647],
    zoom: 14,
    editable: true,
    drawControl: true
});

// Кастомный классический слой
L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 20,
    id: "evolext/ckdptqjxu0k091isig2sz5xei",
    tileSize: 512,
    zoomOffset: -1,
    accessToken: "pk.eyJ1IjoiZXZvbGV4dCIsImEiOiJja2Nqeml1dTcxcGJjMnFvOGdsZGxhOHV5In0.eaJ9XIWElB4JaCejC3JpJQ"
}).addTo(app.map);

// Более "ландшафтный" слой
//L.tileLayer.provider('OpenStreetMap.Mapnik').addTo(app.map);

// Добавление кнопки экспорта карты
// L.control.bigImage({position: 'topleft'}).addTo(map);


// Назнвачает фукнкции добавления объекта на карту по клику
document.getElementById("toolsPanel").querySelectorAll("#addingNodes button").forEach((item) => item.addEventListener("click", function() {
    // Отключаем обработчики, включенные ранее        
    app.map.off("click");
    // Определеяем тип добавляемого объекта
    let objectType = this.id.slice("buttonAdd".length).toLowerCase();
    // С помощью bind передаем в качетсве обработчика функцию, с "вшитым параметром",
    // потому что мы тут не вызываем функцию, а передаем только прототип
    app.map.on("click", addObjectOnPoint.bind(null, objectType));
}));


// Обрабатывает событие контектсного меню геообъекта "Начать путь"
$("#map").on("click", ".startPipe", function(e) {
    // Индекс инициализирующего объекта
    let objId = Number(e.target.dataset.id);
    let index = app.geoObjects.findIndex((obj) => obj.id == objId);
    // Координаты инициализирующего объекта
    initPipe(app.geoObjects[index].value.getLatLng());
    // Закрытие popup объекта
    app.geoObjects[index].value.closePopup();
});

// Обрабатывает удаление объекта с карты
$("#map").on("click", ".removeObject", function(e) {
    let objectId = Number(e.target.dataset.id);
    let index = app.geoObjects.findIndex((obj) => obj.id == objectId);

    // Удаление геообъекта
    if (index >= 0) {
        app.geoObjects[index].value.removeFrom(app.map);
        app.geoObjects.splice(index, 1);
    }
    // Удаление пайпа
    else {
        // Удаление с карты 
        app.pipes.get(objectId).removeFrom(app.map);
        // Удаление декоратора
        app.pipesArrows.get(objectId).removeFrom(app.map);
        // Удаление соответствующих объектов
        app.pipes.delete(objectId);
        app.pipesArrows.delete(objectId);
    }

    // Удаление информации об объекте
    app.objectsInfo.delete(objectId);

    // Если все геообъекты удалены - то кнопка сохранения схемы блокируется
    if (app.geoObjects.length == 0 && app.pipes.size == 0) {
        document.getElementById("saveNetwork").disabled = true;
    }
});

app.map.on("editable:vertex:click", function (e) {
    e.vertex.continue();
});

// Соединяет два геообъекта пайпом
app.map.on("editable:drawing:click", function(e) {
    let target = e.originalEvent.target;
    if (target.id != "map") {
        e.cancel();

        // Ставим точку точно в центр геообъекта
        // 1. Находим элемент, по которому прошел клик
        // 2. Получаем точки редактируеемого пайпа и добвляем к ним точку центра объекта, по которому прошел клик
        // 3. Перерисовываем редактируемый пайп
        let obj = app.geoObjects.find(elem => elem.value._icon._leaflet_id == target._leaflet_id);
        let pipe = app.pipes.get(app.editableId);
        let points = pipe.getLatLngs();
        points.unshift(obj.value.getLatLng());
        pipe.redraw();

        // Завершаем редактирование
        pipe.disableEdit();
        pipe.bindPopup(app.pipePopup);
        app.polylineEditor = null;
        app.editableId = null;
        app.pipePopup = null;
    }
});

// Обрабатывает открытие контексного меню пайпа при его отрисовке (или редактировании)
app.map.on("editable:vertex:contextmenu", function (e) {
    app.map.editTools.stopDrawing();

    // Открытие контекстного меню редактора пайпа
    if (!app.editablePopup) {
        app.editablePopup= L.popup();
        app.editablePopup.setContent(
            "<div style='display: flex; flex-direction: column; align-items: center;'>" + 
                "<h1>Путь</h1>" +
                "<button class='continuePipe popupButton'>Продолжить</button>" +
                "<button class='endPipe popupButton'>Завершить редактирование</button>" +
                "<button class='removeVertex popupButton'>Удалить вершину</button>" +
                "<button class='removePipe popupButton'>Удалить весь путь</button>" +
            "</div>" +
            "<div id='popupAddingNodes' style='display: flex; flex-direction: column; align-items: center; margin-top: 20px;'>" +
                "<h1>Добавить объект</h1>" +
                "<button class='initTower popupButton'>Водонапорная башня</button>" +
                "<button class='initReservoir popupButton'>Контррезервуар</button>" +
                "<button class='initStandpipe popupButton'>Колонка</button>" +
                "<button class='initHydrant popupButton'>Гидрант</button>" +
                "<button class='initWell popupButton'>Водопроводный колодец</button>" +
                "<button class='initBranch popupButton'>Разветвление</button>" +
                "<button class='initConsumer popupButton'>Потребитель</button>" +
            "</div>"
        );
    }

    app.editablePopup.setLatLng(e.latlng);
    app.editablePopup.openOn(app.map);

    let addingPanel = document.getElementById("popupAddingNodes");
    let allButtons = Array.from(document.querySelectorAll("div.leaflet-popup-content .popupButton"));

    // Для непоследних вершин пайпа
    if (e.latlng != e.sourceTarget.latlngs[0]) {

        // Для начальной вершины пути вообще не должно быть инициализации объекта
        if (e.latlng == e.sourceTarget.latlngs[e.sourceTarget.latlngs.length - 1]) {
            addingPanel.style.display = "none";
        }
        else {
            addingPanel.style.display = "flex";
        }
        
        // Валидные кнопки
        const validButtons = ["endPipe", "removePipe", "initWell", "initBranch"];

        // Оставляем только валидные кнопки в контекстном меню
        allButtons.map(function(elem) {
            elem.hidden = !(validButtons.includes(elem.classList[0]));
        });
    }
    else {
        addingPanel.style.display = "flex";
        allButtons.forEach(button => button.hidden = false);
    }
});

// Показывает окно с гидравлическими характеристиками геообъекта
$("#map").on("click", ".getInfo", function(e) {
    app.map.closePopup();

    // Идентификатор объекта
    let objectId = Number(e.target.dataset.id);

    // Определение типа объекта (true - узел, false - участок)
    let type = app.geoObjects.find((node) => node.id == objectId) !== undefined;
    
    // Получение запрашиваемой инфомрации
    let info = app.objectsInfo.get(objectId);

    // Настройка вида открывающегося окна
    params = "left=500, top=100, height=300, width=";
    params += type ? "460" : "640";

    url = type ? "./info_object.html" : "./info_pipe.html";

    // Открытие окна с информацией
    let openingWindow = window.open(url, "window", params);

    // Заполнение таблицы с данными
    openingWindow.addEventListener("load", function() {

        // Общие данные и для узлов, и для участков
        openingWindow.document.getElementById("name").value = info.name;

        if (typeof info.h !== "undefined") {
            openingWindow.document.getElementById("pressure").value = info.h;
        }

        if (typeof info.q !== "undefined") {
            // Для узлов, в случае моделирования
            if (type && typeof info.q !== "string") {
                openingWindow.document.getElementById("consumption").hidden = true;
                openingWindow.document.getElementById("checkbox").setAttribute("checked", "checked");
                openingWindow.document.getElementById("distribParams").hidden = false;
                
                let select = openingWindow.document.querySelector("select");
                select.hidden = false;
                select.value = info.q.distrib;

                openingWindow.chooseDistrib();

                for (let [key, value] of Object.entries(info.q)) {
                    if (key != "distrib") {
                        openingWindow.document.getElementById(key).querySelector("input").value = value;
                    }
                }
            }
            else {
                openingWindow.document.getElementById("consumption").value = info.q;
            }
        }
        

        // Данные, указываемые только для участков
        if (!type) {    
            // Длина участка
            if (typeof info.length !== "undefined") {
                openingWindow.document.getElementById("length").value = info.length;
            }
            // Материал трубы
            openingWindow.document.getElementById("material").value = info.material;
            // Внутренний диаметр трубы
            openingWindow.document.getElementById("diameter").value = info.diameter;
            // Скорость переносимого вещества
            openingWindow.document.getElementById("slider").value = info.velocity;
            openingWindow.document.getElementById("speed").value = info.velocity;
            // Гидравлическое сопротивление участка
            if (typeof info.resist !== "undefined") {
                openingWindow.document.getElementById("resist").value = info.resist;
            }
            // Для участков передаем информацию о его реальной длине
            let points = app.pipes.get(objectId).getLatLngs();
            let length = 0;
            for (let i = 0; i < points.length - 1; i++) {
                length += points[0].distanceTo(points[i+1]);
            }
            openingWindow.document.getElementById("length").dataset.natural_length = length.toFixed(4);
        }
    });

    // Обновляем данные после закрытия
    openingWindow.addEventListener("unload", function() {
        if (openingWindow.document.getElementById("consumption")) {
            
            // Данные по узлам
            if (type)
            {
                // Если значения моделируются, то сохраняется информация для моделирвания
                if (openingWindow.document.getElementById("checkbox").checked) {
                    // Вид распределения
                    info.q = {
                        distrib: openingWindow.document.querySelector("select").value,
                    }
                    // Параметры распределения
                    let paramCell = openingWindow.document.querySelector("#distribParams td:nth-child(2)");
                    // Чтение названия параметра и его значения
                    for (let param of paramCell.childNodes) {
                        info.q[param.id] = param.querySelector("input").value;
                    }
                }
                // Если данные известны
                else {
                    info.q = openingWindow.document.getElementById("consumption").value;
                }                
            }
            // Данные по участкам
            else {
                info.q = openingWindow.document.getElementById("consumption").value;
                info.length = openingWindow.document.getElementById("length").value;
                info.material = openingWindow.document.getElementById("material").value;
                info.diameter = openingWindow.document.getElementById("diameter").value;
                info.velocity = openingWindow.document.getElementById("speed").value;
            }
            
            info.name = openingWindow.document.getElementById("name").value;
            info.h = openingWindow.document.getElementById("pressure").value;
        }
    });
});

// Обрабатывает событие открытия контекстного мен) у геообъектов
// app.map.on('popupopen', function(e) {
//     if (typeof e.popup._source === 'undefined') {
//         return;
//     }
    
//     // Проверяем, является ли геообъектом (только у них обрабатываем )
//     let obj = app.geoObjects.find(elem => elem.value._leaflet_id == e.popup._source._leaflet_id);
//     if (typeof obj !== 'undefined') {
//         // Устанавилваем переключатель режима в нужное положение (если объект имеет два режима)
//         let checkbox = document.querySelector('input[type="checkbox"]');
//         if (checkbox)
//             checkbox.checked = (objectsInfo.get(obj.id).activity == 1);
//     }
// });


dragElement(document.getElementById("plotPopup"));

function dragElement(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    document.querySelector("#plotPopup p").onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();

        // Позиция курсора мыши при запуске
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;

        // Вызываемая функция для каждого перемещения
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();

        // Высчитывание нового положения курсора
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        // Установка новой позиции элементу
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    // Прекращение движения при отпускании мыши
    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}